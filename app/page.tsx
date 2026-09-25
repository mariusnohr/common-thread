import { Game } from "@/app/components/game";
import { todayInOslo } from "@/lib/puzzle/oslo";
import { getPuzzleForDate } from "@/lib/puzzle/queries";
import { shuffleWords } from "@/lib/puzzle/shuffle";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = todayInOslo();
  const puzzle = await getPuzzleForDate(today);

  return (
    <main className="shell">
      <header className="header">
        <h1>Common Thread</h1>
        <p className="date">Dagens oppgave · {today}</p>
      </header>

      {puzzle ? (
        // Only the words are sent to the browser; the group assignments stay
        // on the server and are checked by `submitGuess`.
        <Game
          puzzleId={puzzle.id}
          words={shuffleWords(puzzle.words, puzzle.publishDate)}
        />
      ) : (
        <p className="empty">Ingen oppgave i dag</p>
      )}
    </main>
  );
}
