# Floke

Et daglig ordpuslespill (repo: `common-thread`): seksten ord, fire skjulte
grupper på fire ord, tre oppgaver per dag (lett, middels og vanskelig). Siden
serverer dagens oppgaver fra Postgres og sjekker alle gjetninger på serveren,
så gruppeinndelingen aldri sendes til nettleseren.

## Spillet

- Spilleren har **tre liv**. En feil koster ett liv, og tre av fire riktige
  gir beskjed om «én unna». Samme gjetning to ganger koster ingenting.
- Liv som er igjen blir til stjerner (feilfritt gir tre).
- Fremgang, resultater, stjerner og rekke (dager på rad med minst én løst
  oppgave) lagres bare i nettleseren (`localStorage`, `lib/game/storage.ts`).
- «Del resultatet» lager et rutenett i farger uten å avsløre ordene
  (`lib/game/score.ts`).
- Navnet på spillet står ett sted: `APP_NAME` i `lib/brand.ts`.
- Animasjonene respekterer `prefers-reduced-motion`.

## Kom i gang

```bash
cp .env.example .env.local   # fyll inn verdier
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Miljøvariabler

Se `.env.example`. I produksjon settes variablene i pm2 sin `env`-blokk, ikke
i en fil.

| Variabel | Beskrivelse |
| --- | --- |
| `DATABASE_URL` | Postgres-tilkobling for app-rollen `common_thread` |
| `TEST_DATABASE_URL` | Egen database for database-tester |
| `ADMIN_PASSWORD` | Passord for admin |
| `SESSION_SECRET` | 32+ tilfeldige bytes, signerer admin-cookien |
| `LAUNCH_DATE` | Dato for oppgave «Nr. 1» (`YYYY-MM-DD`) |
| `ANTHROPIC_API_KEY` | API-nøkkel for Anthropic (hvis du bruker Claude) |
| `OPENAI_API_KEY` | API-nøkkel for OpenAI (hvis du bruker GPT) |
| `AI_MODEL` | Valgfri. `anthropic:<modell>` eller `openai:<modell>`, f.eks. `anthropic:claude-sonnet-5` eller `openai:gpt-5.5` |

## Skript

| Skript | Gjør |
| --- | --- |
| `pnpm dev` | Utviklingsserver |
| `pnpm build` / `pnpm start` | Produksjonsbygg og -start |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest (database-tester hoppes over uten `TEST_DATABASE_URL`) |
| `pnpm db:generate` | Genererer migrasjonsfiler fra `db/schema.ts` |
| `pnpm db:migrate` | Anvender migrasjoner (idempotent) |
| `pnpm db:seed` | Setter inn/oppdaterer 10 lette oppgaver fra `LAUNCH_DATE` |
| `pnpm db:studio` | Drizzle Studio for lokal inspeksjon |

## Database

Postgres med Drizzle. `db/client.ts` eier én delt `pg`-pool (`max: 5`) som
caches på `globalThis`. Migrasjoner ligger som SQL-filer i `db/migrations` og
kjøres med `pnpm db:migrate` ved hver deploy, før appen restartes. En dag
representeres som `date`, og `UNIQUE(publish_date, level)` garanterer maks én
oppgave per dag og nivå (`easy`, `medium`, `hard`). Oppgaver fra før nivåene
fantes ble `easy`.

## Admin

Eieren logger inn på `/admin/login` med `ADMIN_PASSWORD` og får en signert,
HttpOnly-cookie (7 dager) som bare gjelder under `/admin`. Cookien signeres med
HMAC-SHA256 ved hjelp av `SESSION_SECRET`, som må være minst 32 byte. Mangler
eller er hemmeligheten for kort, nekter appen å starte.

- `/admin` viser alle oppgaver med dato, nummer, nivå, status og gruppenavn,
  og markerer dager og nivåer de neste 30 dagene som mangler en godkjent
  oppgave.
- `/admin/puzzles/new` og `/admin/puzzles/[id]` lager og redigerer en oppgave:
  dato, nivå, status (`suggested`, `draft`, `approved`) og fire grupper med
  fire ord hver. Feil vises ved riktig felt, og ingenting skrives før alt er
  gyldig.
- Bare oppgaver med status `approved` vises på `/`. Spilleren velger nivå med
  `/?niva=lett|middels|vanskelig`. Endrer du en oppgave til `draft`,
  forsvinner den ved neste sidevisning.

## AI-genererte oppgaver

«Generer med AI» på `/admin` lager et forslag for en dato og et nivå med
[AI SDK](https://ai-sdk.dev) (Anthropic eller OpenAI, se `AI_MODEL`).
Forslaget lagres som `suggested` og åpnes i redigeringen, så ingenting vises
før du har sjekket og godkjent det. Oppgaver som ikke er godkjent kan
genereres på nytt fra redigeringssiden.

- Prompten ligger i `lib/ai/puzzle-prompt.ts`: felles regler i
  `PUZZLE_SYSTEM_PROMPT` og hva som gjør et nivå lett, middels eller vanskelig
  i `LEVEL_GUIDES`. Endre den der for å justere oppgavene.
- `lib/ai/generate-puzzle.ts` sjekker svaret (4 × 4 unike ord, bare
  bokstaver, maks 14 tegn, gruppenavnet inneholder ikke egne ord, ingen tema
  fra de siste oppgavene) og prøver opptil tre ganger med tilbakemelding til
  modellen.
- Gruppenavn fra de siste 45 oppgavene sendes med, så modellen unngår å
  gjenta temaer.
- `pnpm db:seed` bruker samme lagringsfunksjon (`savePuzzle`), så seed og admin
  oppfører seg likt og kan kjøres flere ganger uten duplikater.

## Deploy

```bash
pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build && pm2 reload common-thread
```
