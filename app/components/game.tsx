"use client";

import { useState, useTransition, useReducer } from "react";
import { revealPuzzle, submitGuess } from "@/app/actions/game";
import { createGameState, gameReducer, MAX_MISTAKES } from "@/lib/puzzle/reducer";

type GameProps = {
  puzzleId: number;
  words: string[];
};

export function Game({ puzzleId, words }: GameProps) {
  const [state, dispatch] = useReducer(gameReducer, words, createGameState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const solvedWords = new Set(state.solved.flatMap((group) => group.words));
  const remainingWords = state.words.filter((word) => !solvedWords.has(word));

  function submitSelection() {
    if (state.selected.length !== 4) {
      setError("Velg fire ord.");
      return;
    }
    setError(null);
    const guess = [...state.selected];
    startTransition(async () => {
      const result = await submitGuess(puzzleId, guess);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.correct) {
        dispatch({ type: "solve", group: result.group });
      } else if (state.mistakes + 1 >= MAX_MISTAKES) {
        // Out of attempts: show the remaining groups.
        dispatch({ type: "wrong" });
        const revealed = await revealPuzzle(puzzleId);
        if (revealed.ok) {
          dispatch({ type: "reveal", groups: revealed.groups });
        }
      } else {
        dispatch({ type: "wrong" });
      }
    });
  }

  function reveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealPuzzle(puzzleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dispatch({ type: "reveal", groups: result.groups });
    });
  }

  const isOver = state.status !== "playing";

  return (
    <section className="game">
      <div className="groups">
        {state.solved.map((group) => (
          <article
            key={group.difficulty}
            className={`group difficulty-${group.difficulty}`}
          >
            <h2>{group.name}</h2>
            <p>{group.words.join(" · ")}</p>
          </article>
        ))}
      </div>

      {state.status === "won" && (
        <p className="banner win">Gratulerer, du fant alle gruppene!</p>
      )}
      {state.status === "lost" && (
        <p className="banner lose">Ingen flere forsøk — her er løsningen.</p>
      )}

      {!isOver && (
        <>
          <div className="board" role="group" aria-label="Ord">
            {remainingWords.map((word) => (
              <button
                key={word}
                type="button"
                className={
                  state.selected.includes(word) ? "word selected" : "word"
                }
                aria-pressed={state.selected.includes(word)}
                onClick={() => dispatch({ type: "toggle", word })}
              >
                {word}
              </button>
            ))}
          </div>

          <div className="controls">
            <button
              type="button"
              onClick={submitSelection}
              disabled={isPending || state.selected.length !== 4}
            >
              Send inn
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "clear" })}
              disabled={isPending || state.selected.length === 0}
            >
              Tøm
            </button>
            <button type="button" onClick={reveal} disabled={isPending}>
              Gi opp
            </button>
          </div>

          <p className="mistakes">
            Feil: {state.mistakes} / {MAX_MISTAKES}
          </p>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
