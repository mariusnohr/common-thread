"use client";

import { computeStats } from "@/lib/game/stats";
import { useResults } from "@/lib/game/storage";
import { FlameIcon, StarIcon } from "./icons";

/** Streak and star total in the header. Hidden until there is something to show. */
export function PlayerChips({ date }: { date: string }) {
  const results = useResults();
  if (!results) return null;

  const stats = computeStats(results, date);
  if (stats.played === 0) return null;

  return (
    <div className="chips">
      <span
        className={stats.streak > 0 ? "chip streak lit" : "chip streak"}
        title="Dager på rad med minst én løst oppgave"
      >
        <FlameIcon />
        <span>{stats.streak}</span>
        <span className="sr-only"> dager på rad</span>
      </span>
      <span className="chip stars" title="Stjerner samlet">
        <StarIcon />
        <span>{stats.stars}</span>
        <span className="sr-only"> stjerner</span>
      </span>
    </div>
  );
}
