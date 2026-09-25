# Roadmap

## Shipped
- Phase 1: Next.js scaffold, 4×4 board, client reducer, Vitest/ESLint setup
- Phase 2: Postgres (node-postgres + Drizzle migrations), Oslo-date daily puzzle, server-side guess validation, seed 10 puzzles, pm2 ecosystem file
- Reveal remaining groups on loss, per-request shuffle, puzzle number, standalone output
- Phase 3: Admin login (signed cookie) and create/edit/approve puzzles; seed and admin share upsert logic

## In progress

## Planned
- Keep game progress across reloads (localStorage per puzzleId)
- "One away" hint and ignore repeated wrong guesses
- Archive of past puzzles by number
- Phase 4: opencode-generated puzzle suggestions (status `suggested`) reviewed in admin
