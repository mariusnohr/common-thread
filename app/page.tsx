import Link from "next/link";
import { Game } from "@/app/components/game";
import { HelpButton } from "@/app/components/help-dialog";
import { LogoMark } from "@/app/components/icons";
import { LevelNav, type LevelLink } from "@/app/components/level-nav";
import { PlayerChips } from "@/app/components/player-chips";
import { APP_NAME } from "@/lib/brand";
import {
  LEVEL_LABELS,
  levelFromSlug,
  levelSlug,
  PUZZLE_LEVELS,
} from "@/lib/puzzle/levels";
import { puzzleNumberForDate } from "@/lib/puzzle/number";
import { formatNorwegianDay, todayInOslo } from "@/lib/puzzle/oslo";
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

  const levels: LevelLink[] = PUZZLE_LEVELS.map((candidate) => ({
    level: candidate,
    label: LEVEL_LABELS[candidate],
    href: `/?niva=${levelSlug(candidate)}`,
    available: available.includes(candidate),
  }));

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label={`${APP_NAME}, forsiden`}>
          <LogoMark className="brand-mark" />
          <span className="wordmark">{APP_NAME}</span>
        </Link>
        <div className="topbar-actions">
          <PlayerChips date={today} />
          <HelpButton />
        </div>
      </header>

      <p className="daybar">
        {puzzleNumber && available.length > 0 && (
          <span className="badge">Nr. {puzzleNumber}</span>
        )}
        <span className="day">{formatNorwegianDay(today)}</span>
      </p>

      {available.length > 0 && <LevelNav levels={levels} active={level} date={today} />}

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
          date={today}
          level={level}
          puzzleNumber={puzzleNumber}
          levels={levels}
        />
      ) : (
        <div className="empty-state">
          <LogoMark className="empty-mark" />
          <p className="empty-title">
            {available.length === 0
              ? "Ingen oppgave i dag"
              : `Ingen ${LEVEL_LABELS[level].toLowerCase()} oppgave i dag`}
          </p>
          <p className="muted">
            {available.length === 0
              ? "Trådene nøstes fortsatt. Kom tilbake litt senere."
              : "Velg et annet nivå over."}
          </p>
        </div>
      )}
    </main>
  );
}
