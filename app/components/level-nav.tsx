"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { MAX_STARS } from "@/lib/game/score";
import { useResults } from "@/lib/game/storage";
import type { PuzzleLevel } from "@/lib/puzzle/types";
import { CheckIcon, StarIcon } from "./icons";

export type LevelLink = {
  level: PuzzleLevel;
  label: string;
  href: string;
  available: boolean;
};

type LevelNavProps = {
  levels: LevelLink[];
  active: PuzzleLevel;
  date: string;
};

/** Segmented level picker with a sliding highlight and today's results. */
export function LevelNav({ levels, active, date }: LevelNavProps) {
  const results = useResults();
  const today = results?.[date];
  const activeIndex = Math.max(
    0,
    levels.findIndex((candidate) => candidate.level === active),
  );

  return (
    <nav
      className="levels"
      aria-label="Nivå"
      style={{ "--active": activeIndex, "--count": levels.length } as CSSProperties}
    >
      <span className="levels-indicator" aria-hidden="true" />
      {levels.map((candidate, index) => {
        const result = today?.[candidate.level];
        const content = (
          <>
            <span className="level-label">{candidate.label}</span>
            <span className="level-meta" aria-hidden="true">
              {result ? (
                result.won ? (
                  Array.from({ length: MAX_STARS }, (_, star) => (
                    <StarIcon key={star} className={star < result.stars ? "on" : "off"} />
                  ))
                ) : (
                  <span className="level-done">ferdig</span>
                )
              ) : (
                Array.from({ length: 3 }, (_, pip) => (
                  <span key={pip} className={pip <= index ? "pip on" : "pip"} />
                ))
              )}
            </span>
            {result?.won && (
              <span className="level-check" aria-label="løst">
                <CheckIcon />
              </span>
            )}
          </>
        );

        if (!candidate.available) {
          return (
            <span
              key={candidate.level}
              className="level unavailable"
              aria-disabled="true"
              title="Ingen oppgave på dette nivået i dag"
            >
              {content}
            </span>
          );
        }

        const isActive = candidate.level === active;
        return (
          <Link
            key={candidate.level}
            href={candidate.href}
            scroll={false}
            className={isActive ? "level active" : "level"}
            aria-current={isActive ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
