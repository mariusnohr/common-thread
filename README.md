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

## Deploy

```bash
pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build && pm2 reload common-thread
```
