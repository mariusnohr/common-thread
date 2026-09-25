# AGENTS.md

Conventions for working in this repository.

## Language

- User-facing text (UI, error messages, emails) is **Norwegian**.
- Code, comments, commit messages and documentation are **English**.
- Keep the existing tone: short, lowercase Norwegian sentences without
  exclamation marks.

## Checks before committing

```bash
pnpm lint && pnpm typecheck && pnpm test
```

All three must pass. Database-backed suites are skipped unless
`TEST_DATABASE_URL` is set; run them against the dedicated test database when
you touch `db/` or `lib/puzzle/mutations.ts`.

## Dependencies

Do not add a new runtime or development dependency without asking first. The
standard library and the existing dependencies are usually enough.

## Deploy

```bash
pnpm install --frozen-lockfile && pnpm db:migrate && pnpm build && pm2 reload common-thread
```

See the README for environment variables and the pm2 `env` block. Never commit
real secrets.

## Branches

- Delete a branch as soon as its pull request is merged. Turn on "Automatically
  delete head branches" in the repository settings so this happens by itself.
- Keep `main` as the only long-lived branch.
