"use client";

import { useState, type CSSProperties } from "react";

const COLORS = ["var(--g1)", "var(--g2)", "var(--g3)", "var(--g4)", "var(--thread)", "#ffffff"];

type Piece = {
  dx: number;
  up: number;
  delay: number;
  duration: number;
  spin: number;
  size: number;
  color: string;
  round: boolean;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, index) => ({
    dx: (Math.random() - 0.5) * 100,
    up: -(12 + Math.random() * 30),
    delay: Math.random() * 0.5,
    duration: 2.2 + Math.random() * 1.8,
    spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
    size: 6 + Math.random() * 7,
    color: COLORS[index % COLORS.length],
    round: index % 4 === 0,
  }));
}

/** A one-shot burst of confetti from the middle of the screen. Purely decorative. */
export function Confetti({ count = 110 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count));

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece, index) => (
        <i
          key={index}
          className={piece.round ? "round" : undefined}
          style={
            {
              "--dx": `${piece.dx}vw`,
              "--up": `${piece.up}vh`,
              "--delay": `${piece.delay}s`,
              "--duration": `${piece.duration}s`,
              "--spin": `${piece.spin}deg`,
              "--size": `${piece.size}px`,
              "--color": piece.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
