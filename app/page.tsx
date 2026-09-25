import { Game } from "@/app/components/game";
import { puzzleNumberForDate } from "@/lib/puzzle/number";
import { todayInOslo } from "@/lib/puzzle/oslo";
import { getPuzzleForDate } from "@/lib/puzzle/queries";
import { randomSeed, shuffleWords } from "@/lib/puzzle/shuffle";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayInOslo();
  const puzzle = await getPuzzleForDate(today);
  const puzzleNumber = puzzle
    ? puzzleNumberForDate(process.env.LAUNCH_DATE, puzzle.publishDate)
    : null;

  return (
    <main className="shell">
      <header className="header">
        <h1>Common Thread</h1>
        <p className="date">
          {puzzleNumber ? `Nr. ${puzzleNumber} · ` : ""}
          {today}
        </p>
      </header>

      {puzzle ? (
        // Only the words are sent to the browser; the group assignments stay
        // on the server and are checked by `submitGuess`. The order is
        // shuffled with an unpredictable per-request seed so it cannot be
        // reversed back into the groups.
        <Game
          puzzleId={puzzle.id}
          words={shuffleWords(puzzle.words, randomSeed())}
        />
      ) : (
        <p className="empty">Ingen oppgave i dag</p>
      )}
    </main>
  );
}
