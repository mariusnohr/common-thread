# Roadmap

## Shipped
- Phase 1: Next.js scaffold, 4×4 board, client reducer, Vitest/ESLint setup
- Phase 2: Postgres (node-postgres + Drizzle migrations), Oslo-date daily puzzle, server-side guess validation, seed 10 puzzles, pm2 ecosystem file
- Reveal remaining groups on loss, per-request shuffle, puzzle number, standalone output
- Phase 3: Admin login (signed cookie) and create/edit/approve puzzles; seed and admin share upsert logic
- Phase 4: Easy, medium and hard puzzle per day (`puzzles.level`); AI-generated suggestions (AI SDK, Anthropic or OpenAI) saved as `suggested` and reviewed in admin
- Phase 5: Game redesign and rename to Floke (`APP_NAME` in `lib/brand.ts`): three lives, animated board (deal, hop, shake, FLIP glide, confetti), stars per puzzle, streak and stats, share grid, rules sheet, countdown to the next puzzles
- Keep game progress across reloads (localStorage per puzzleId)
- "One away" hint and ignore repeated wrong guesses

## In progress

## Planned
- Archive of past puzzles by number
