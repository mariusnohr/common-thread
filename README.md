# common-thread

Et daglig ordpuslespill: seksten ord, fire skjulte grupper på fire ord, én
oppgave per dag. Siden serverer dagens oppgave fra Postgres og sjekker alle
gjetninger på serveren, så gruppeinndelingen aldri sendes til nettleseren.

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
| `OPENCODE_URL` | Lokal opencode-server (kun loopback) |
| `LAUNCH_DATE` | Dato for oppgave «Nr. 1» (`YYYY-MM-DD`) |

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
| `pnpm db:seed` | Setter inn/oppdaterer 10 oppgaver fra `LAUNCH_DATE` |
| `pnpm db:studio` | Drizzle Studio for lokal inspeksjon |

## Database

Postgres med Drizzle. `db/client.ts` eier én delt `pg`-pool (`max: 5`) som
caches på `globalThis`. Migrasjoner ligger som SQL-filer i `db/migrations` og
kjøres med `pnpm db:migrate` ved hver deploy, før appen restartes. En dag
representeres som `date` med `UNIQUE`, så databasen garanterer maks én oppgave
per dag.

## Admin

Eieren logger inn på `/admin/login` med `ADMIN_PASSWORD` og får en signert,
HttpOnly-cookie (7 dager) som bare gjelder under `/admin`. Cookien signeres med
HMAC-SHA256 ved hjelp av `SESSION_SECRET`, som må være minst 32 byte. Mangler
eller er hemmeligheten for kort, nekter appen å lage og lese sesjoner.

- `/admin` viser alle oppgaver med dato, nummer, status og gruppenavn, og
  markerer dager de neste 30 dagene som mangler en godkjent oppgave.
- `/admin/puzzles/new` og `/admin/puzzles/[id]` lager og redigerer en oppgave:
  dato, status (`suggested`, `draft`, `approved`) og fire grupper med fire ord
  hver. Feil vises ved riktig felt, og ingenting skrives før alt er gyldig.
- Bare oppgaver med status `approved` vises på `/`. Endrer du en oppgave til
  `draft`, forsvinner den ved neste sidevisning.
- `pnpm db:seed` bruker samme lagringsfunksjon (`savePuzzle`), så seed og admin
  oppfører seg likt og kan kjøres flere ganger uten duplikater.

## Deploy

```bash
pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build && pm2 reload common-thread
```
