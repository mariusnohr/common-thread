"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { MAX_STARS, starsFor } from "@/lib/game/score";
import { computeStats } from "@/lib/game/stats";
import { useResults } from "@/lib/game/storage";
import { MAX_MISTAKES, type GameState } from "@/lib/puzzle/reducer";
import type { PuzzleLevel } from "@/lib/puzzle/types";
import { Countdown } from "./countdown";
import { ArrowIcon, FlameIcon, ShareIcon, StarIcon } from "./icons";
import type { LevelLink } from "./level-nav";

type ResultCardProps = {
  state: GameState;
  date: string;
  level: PuzzleLevel;
  levels: LevelLink[];
  onShare: () => void;
};

function headline(state: GameState, stars: number): { title: string; text: string } {
  if (state.status === "won") {
    if (stars >= MAX_STARS) {
      return { title: "Feilfritt", text: "Alle fire trådene, uten en eneste bom." };
    }
    if (stars === MAX_STARS - 1) {
      return { title: "Sterkt", text: "Alle fire gruppene, med bare én bom." };
    }
    return { title: "På håret", text: "Siste liv, men du klarte det." };
  }
  if (state.mistakes >= MAX_MISTAKES) {
    return { title: "Tråden røk", text: "Ikke i dag. Her er løsningen." };
  }
  return { title: "Løsningen", text: "Du ga deg. Her er gruppene." };
}

export function ResultCard({ state, date, level, levels, onShare }: ResultCardProps) {
  const results = useResults();
  const stars = starsFor(state.status, state.mistakes);
  const { title, text } = headline(state, stars);
  const stats = results ? computeStats(results, date) : null;
  const next = levels.filter(
    (candidate) =>
      candidate.available && candidate.level !== level && !results?.[date]?.[candidate.level],
  );

  return (
    <section
      className={`result ${state.status}`}
      aria-labelledby="result-title"
    >
      <div className="result-stars" aria-label={`${stars} av ${MAX_STARS} stjerner`}>
        {Array.from({ length: MAX_STARS }, (_, index) => (
          <StarIcon
            key={index}
            className={index < stars ? "star on" : "star"}
            style={{ "--i": index } as CSSProperties}
          />
        ))}
      </div>
      <h2 id="result-title">{title}</h2>
      <p className="result-text">{text}</p>

      {stats && (
        <dl className="stats">
          <div>
            <dt>Spilt</dt>
            <dd>{stats.played}</dd>
          </div>
          <div>
            <dt>Vunnet</dt>
            <dd>{stats.winRate}%</dd>
          </div>
          <div className={stats.streak > 0 ? "lit" : undefined}>
            <dt>Rekke</dt>
            <dd>
              <FlameIcon className="inline-icon" />
              {stats.streak}
            </dd>
          </div>
          <div>
            <dt>Beste</dt>
            <dd>{stats.bestStreak}</dd>
          </div>
        </dl>
      )}

      <div className="result-actions">
        <button type="button" className="btn primary" onClick={onShare}>
          <ShareIcon className="inline-icon" />
          Del resultatet
        </button>
        {next.map((candidate) => (
          <Link key={candidate.level} href={candidate.href} scroll={false} className="btn secondary">
            Prøv {candidate.label.toLowerCase()}
            <ArrowIcon className="inline-icon" />
          </Link>
        ))}
      </div>

      <p className="next-puzzle">
        Nye oppgaver om <Countdown />
      </p>
    </section>
  );
}
