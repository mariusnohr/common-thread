import Link from "next/link";
import { Game } from "@/app/components/game";
import {
  LEVEL_LABELS,
  levelFromSlug,
  levelSlug,
  PUZZLE_LEVELS,
} from "@/lib/puzzle/levels";
import { puzzleNumberForDate } from "@/lib/puzzle/number";
import { todayInOslo } from "@/lib/puzzle/oslo";
import { getApprovedLevelsForDate, getPuzzleForDate } from "@/lib/puzzle/queries";
import { randomSeed, shuffleWords } from "@/lib/puzzle/shuffle";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ niva?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const today = todayInOslo();
  const { niva } = await searchParams;
  const available = await getApprovedLevelsForDate(today);

  // An explicit `?niva=` wins (even if that level is missing today, so the
  // player sees why); otherwise start on the easiest level that exists.
  const requested = levelFromSlug(Array.isArray(niva) ? niva[0] : niva);
  const level = requested ?? available[0] ?? "easy";

  const puzzle = available.includes(level)
    ? await getPuzzleForDate(today, level)
    : null;
  const puzzleNumber = puzzleNumberForDate(process.env.LAUNCH_DATE, today);

  return (
    <main className="shell">
      <header className="header">
        <h1>Common Thread</h1>
        <p className="date">
          {puzzleNumber && available.length > 0 ? `Nr. ${puzzleNumber} · ` : ""}
          {today}
        </p>
      </header>

      {available.length > 0 && (
        <nav className="levels" aria-label="Nivå">
          {PUZZLE_LEVELS.map((candidate) =>
            available.includes(candidate) ? (
              <Link
                key={candidate}
                href={`/?niva=${levelSlug(candidate)}`}
                className={candidate === level ? "level active" : "level"}
                aria-current={candidate === level ? "page" : undefined}
              >
                {LEVEL_LABELS[candidate]}
              </Link>
            ) : (
              <span key={candidate} className="level unavailable" aria-disabled="true">
                {LEVEL_LABELS[candidate]}
              </span>
            ),
          )}
        </nav>
      )}

      {puzzle ? (
        // Only the words are sent to the browser; the group assignments stay
        // on the server and are checked by `submitGuess`. The order is
        // shuffled with an unpredictable per-request seed so it cannot be
        // reversed back into the groups. `key` resets the board when the
        // player switches level.
        <Game
          key={puzzle.id}
          puzzleId={puzzle.id}
          words={shuffleWords(puzzle.words, randomSeed())}
        />
      ) : (
        <p className="empty">
          {available.length === 0
            ? "Ingen oppgave i dag"
            : `Ingen ${LEVEL_LABELS[level].toLowerCase()} oppgave i dag`}
        </p>
      )}
    </main>
  );
}
