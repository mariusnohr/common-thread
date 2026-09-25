"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { revealPuzzle, submitGuess } from "@/app/actions/game";
import { APP_NAME } from "@/lib/brand";
import { shareText, starsFor } from "@/lib/game/score";
import { loadGame, recordResult, saveGame } from "@/lib/game/storage";
import { LEVEL_LABELS } from "@/lib/puzzle/levels";
import {
  createGameState,
  gameReducer,
  isRepeatGuess,
  livesLeft,
  MAX_MISTAKES,
  wasSolvedByPlayer,
} from "@/lib/puzzle/reducer";
import type { PuzzleLevel } from "@/lib/puzzle/types";
import { Confetti } from "./confetti";
import { HeartIcon, ShuffleIcon } from "./icons";
import type { LevelLink } from "./level-nav";
import { ResultCard } from "./result-card";
import { useReducedMotion } from "./use-reduced-motion";

type GameProps = {
  puzzleId: number;
  words: string[];
  date: string;
  level: PuzzleLevel;
  puzzleNumber: number | null;
  levels: LevelLink[];
};

/** What the board is animating right now. Input is ignored unless `idle`. */
type Phase = "idle" | "checking" | "wrong" | "right";

type Toast = { id: number; text: string; tone: "good" | "bad" | "info" };

const PRAISE = ["godt jobbet", "der satt den", "strålende", "sterkt", "helt rett", "knallbra"];

// Keep in sync with the keyframe durations in globals.css.
const HOP_STAGGER = 90;
const HOP_TIME = 320;
const SHAKE_TIME = 480;
const GLIDE_TIME = 460;
const TOAST_TIME = 1900;
const DEAL_STAGGER = 32;

/** Smallest font (px) for a word on one line before it may wrap instead. */
const MIN_FONT = 11;

const WORDS_PER_GROUP = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function vibrate(pattern: number | number[]): void {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function Game({ puzzleId, words, date, level, puzzleNumber, levels }: GameProps) {
  const [state, dispatch] = useReducer(gameReducer, words, createGameState);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [flash, setFlash] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [breaking, setBreaking] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [dealt, setDealt] = useState(false);
  const reduced = useReducedMotion();
  const busy = useRef(false);
  const toastId = useRef(0);

  const pause = useCallback((ms: number) => sleep(reduced ? 0 : ms), [reduced]);

  const showToast = useCallback((text: string, tone: Toast["tone"]) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, tone });
  }, []);

  // Pick up where the player left off (same device), then deal the cards.
  useEffect(() => {
    const saved = loadGame(puzzleId, words);
    if (saved) {
      dispatch({ type: "restore", state: saved });
      if (saved.status === "lost" && saved.solved.length < WORDS_PER_GROUP) {
        void revealPuzzle(puzzleId).then((result) => {
          if (result.ok) dispatch({ type: "reveal", groups: result.groups });
        });
      }
    }
    setReady(true);
  }, [puzzleId, words]);

  useEffect(() => {
    if (ready) saveGame(puzzleId, state);
  }, [ready, puzzleId, state]);

  // React moves tile nodes when they are reordered, and a moved node restarts
  // its CSS animations. Switch the deal-in animation off once it has played.
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setDealt(true), words.length * DEAL_STAGGER + 700);
    return () => window.clearTimeout(id);
  }, [ready, words.length]);

  useEffect(() => {
    if (!ready || state.status === "playing") return;
    recordResult(date, level, {
      won: state.status === "won",
      stars: starsFor(state.status, state.mistakes),
      mistakes: state.mistakes,
    });
  }, [ready, date, level, state.status, state.mistakes]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_TIME);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (breaking === null) return;
    const id = window.setTimeout(() => setBreaking(null), 900);
    return () => window.clearTimeout(id);
  }, [breaking]);

  useEffect(() => {
    if (!celebrate) return;
    const id = window.setTimeout(() => setCelebrate(false), 5200);
    return () => window.clearTimeout(id);
  }, [celebrate]);

  useEffect(() => {
    if (!confirmGiveUp) return;
    const id = window.setTimeout(() => setConfirmGiveUp(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmGiveUp]);

  const solvedWords = new Set(state.solved.flatMap((group) => group.words));
  const remaining = state.words.filter((word) => !solvedWords.has(word));
  const selectedInOrder = remaining.filter((word) => state.selected.includes(word));
  const lives = livesLeft(state);
  const isOver = state.status !== "playing";
  const isFull = state.selected.length === WORDS_PER_GROUP;
  const isRepeat = isFull && isRepeatGuess(state, state.selected);

  // FLIP: when tiles move (shuffle, a row collapsing into a group), measure
  // where they were and glide them from there instead of jumping.
  const tiles = useRef(new Map<string, HTMLElement>());
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const layoutKey = `${ready}|${state.solved.length}|${remaining.join("|")}`;

  const measure = useCallback(() => {
    const next = new Map<string, { x: number; y: number }>();
    tiles.current.forEach((element, word) => {
      const rect = element.getBoundingClientRect();
      next.set(word, { x: rect.left + window.scrollX, y: rect.top + window.scrollY });
    });
    return next;
  }, []);

  useLayoutEffect(() => {
    tiles.current.forEach((element) => {
      element.getAnimations().forEach((animation) => animation.cancel());
    });
    const next = measure();
    if (!reduced) {
      next.forEach((position, word) => {
        const previous = positions.current.get(word);
        if (!previous) return;
        const dx = previous.x - position.x;
        const dy = previous.y - position.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        tiles.current.get(word)?.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: GLIDE_TIME, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" },
        );
      });
    }
    positions.current = next;
  }, [layoutKey, measure, reduced]);

  // Shrink long words until they fit on their card; very long ones wrap onto
  // two lines instead of becoming unreadably small.
  const fitText = useCallback(() => {
    tiles.current.forEach((tile) => {
      const text = tile.querySelector<HTMLElement>(".tile-text");
      const face = text?.parentElement;
      if (!text || !face) return;
      text.style.fontSize = "";
      text.classList.remove("wrap");
      const faceStyle = window.getComputedStyle(face);
      const available =
        face.clientWidth - parseFloat(faceStyle.paddingLeft) - parseFloat(faceStyle.paddingRight);
      const natural = text.scrollWidth;
      if (natural <= available || available <= 0) return;
      const base = parseFloat(window.getComputedStyle(text).fontSize);
      const oneLine = Math.floor(((base * available) / natural) * 10) / 10;
      if (oneLine >= MIN_FONT) {
        text.style.fontSize = `${oneLine}px`;
        return;
      }
      // Too long for one line: wrap, then shrink until it fits on two.
      text.classList.add("wrap");
      let size = Math.min(base, ((base * available) / (natural / 2)) * 0.9);
      text.style.fontSize = `${size}px`;
      const lineHeight = () => parseFloat(window.getComputedStyle(text).lineHeight) || size * 1.1;
      while (size > MIN_FONT - 2 && text.scrollHeight > lineHeight() * 2 + 1) {
        size -= 0.5;
        text.style.fontSize = `${size}px`;
      }
    });
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    fitText();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) fitText();
    });
    return () => {
      cancelled = true;
    };
  }, [ready, fitText]);

  useEffect(() => {
    const onResize = () => {
      fitText();
      positions.current = measure();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure, fitText]);

  function toggle(word: string) {
    if (phase !== "idle" || isOver) return;
    if (state.selected.length >= WORDS_PER_GROUP && !state.selected.includes(word)) {
      showToast("du har allerede valgt fire", "info");
      return;
    }
    setConfirmGiveUp(false);
    dispatch({ type: "toggle", word });
  }

  function shuffle() {
    if (phase !== "idle" || isOver) return;
    dispatch({ type: "shuffle", seed: `${Date.now()}-${Math.random()}` });
  }

  async function submit() {
    if (busy.current || isOver || state.selected.length !== WORDS_PER_GROUP) return;
    const guess = [...state.selected];
    if (isRepeatGuess(state, guess)) {
      showToast("den har du prøvd før", "info");
      return;
    }

    busy.current = true;
    setConfirmGiveUp(false);
    setPhase("checking");
    try {
      const [result] = await Promise.all([
        submitGuess(puzzleId, guess),
        pause(HOP_STAGGER * (WORDS_PER_GROUP - 1) + HOP_TIME),
      ]);

      if (!result.ok) {
        setPhase("idle");
        showToast(result.error, "bad");
        return;
      }

      if (result.correct) {
        // Colour the tiles, glide them into the top free row, then fold
        // them into the group bar.
        setFlash(result.group.difficulty);
        setPhase("right");
        dispatch({ type: "promote", words: guess });
        await pause(GLIDE_TIME + 160);
        dispatch({ type: "solve", group: result.group });
        setFlash(null);
        setPhase("idle");
        if (state.solved.length + 1 === WORDS_PER_GROUP) {
          if (!reduced) setCelebrate(true);
          vibrate([30, 60, 30, 60, 60]);
        } else {
          showToast(pick(PRAISE), "good");
          vibrate(25);
        }
        return;
      }

      const livesAfter = lives - 1;
      setPhase("wrong");
      setBreaking(livesAfter);
      vibrate([80, 40, 80]);
      const base = result.oneAway ? "én unna" : "ikke helt";
      showToast(
        livesAfter === 0 ? "tomt for liv" : livesAfter === 1 ? `${base} · siste liv` : base,
        result.oneAway ? "info" : "bad",
      );
      await pause(SHAKE_TIME);
      dispatch({ type: "wrong", guess });
      setPhase("idle");

      if (livesAfter <= 0) {
        const revealed = await revealPuzzle(puzzleId);
        if (revealed.ok) dispatch({ type: "reveal", groups: revealed.groups });
        else showToast(revealed.error, "bad");
      }
    } catch {
      setFlash(null);
      setPhase("idle");
      showToast("noe gikk galt, prøv igjen", "bad");
    } finally {
      busy.current = false;
    }
  }

  async function giveUp() {
    if (busy.current || isOver) return;
    if (!confirmGiveUp) {
      setConfirmGiveUp(true);
      return;
    }
    busy.current = true;
    setConfirmGiveUp(false);
    try {
      const result = await revealPuzzle(puzzleId);
      if (result.ok) dispatch({ type: "reveal", groups: result.groups });
      else showToast(result.error, "bad");
    } catch {
      showToast("noe gikk galt, prøv igjen", "bad");
    } finally {
      busy.current = false;
    }
  }

  async function share() {
    const text = shareText({
      appName: APP_NAME,
      puzzleNumber,
      levelLabel: LEVEL_LABELS[level],
      status: state.status,
      mistakes: state.mistakes,
      guesses: state.guesses,
      groups: state.solved,
      url: window.location.origin,
    });

    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("kopiert, lim inn hvor du vil", "good");
    } catch {
      showToast("kunne ikke kopiere", "bad");
    }
  }

  const revealedOrder = state.solved
    .filter((group) => !wasSolvedByPlayer(state, group))
    .map((group) => group.difficulty);
  const foundDifficulties = new Map(
    state.solved.map((group) => [group.difficulty, wasSolvedByPlayer(state, group)]),
  );

  return (
    <section className="game" aria-label="Spillebrett">
      <div className="hud">
        <div
          className={lives === 1 && !isOver ? "lives last" : "lives"}
          role="img"
          aria-label={`${lives} av ${MAX_MISTAKES} liv igjen`}
        >
          {Array.from({ length: MAX_MISTAKES }, (_, index) => {
            const alive = index < lives;
            const className = [
              "heart",
              alive ? "alive" : "lost",
              breaking === index ? "breaking" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return <HeartIcon key={index} className={className} />;
          })}
        </div>
        <div
          className="found"
          role="img"
          aria-label={`${state.solved.length} av ${WORDS_PER_GROUP} grupper`}
        >
          {[1, 2, 3, 4].map((difficulty) => {
            const found = foundDifficulties.get(difficulty);
            return (
              <span
                key={difficulty}
                className={
                  found === undefined
                    ? "found-dot"
                    : `found-dot on g-${difficulty}${found ? "" : " revealed"}`
                }
              />
            );
          })}
        </div>
      </div>

      <div className="groups">
        {state.solved.map((group) => {
          const mine = wasSolvedByPlayer(state, group);
          return (
            <article
              key={group.difficulty}
              className={`group g-${group.difficulty}${mine ? "" : " revealed"}`}
              style={{ "--i": mine ? 0 : revealedOrder.indexOf(group.difficulty) } as CSSProperties}
            >
              <h3>{group.name}</h3>
              <p>{group.words.join(", ")}</p>
            </article>
          );
        })}
      </div>

      {!isOver && (
        <>
          <div
            className={`board phase-${phase}${dealt ? " dealt" : ""}`}
            role="group"
            aria-label="Ord"
          >
            {!ready
              ? Array.from({ length: words.length }, (_, index) => (
                  <span key={index} className="tile placeholder" aria-hidden="true">
                    <span className="tile-deal">
                      <span className="tile-face back" />
                    </span>
                  </span>
                ))
              : remaining.map((word, index) => {
                  const selected = state.selected.includes(word);
                  const face = ["tile-face"];
                  if (selected) {
                    face.push("is-selected");
                    if (phase === "checking") face.push("hop");
                    if (phase === "wrong") face.push("shake");
                    if (phase === "right" && flash) face.push("flash", `g-${flash}`);
                  }
                  return (
                    <button
                      key={word}
                      ref={(element) => {
                        if (element) tiles.current.set(word, element);
                        else tiles.current.delete(word);
                      }}
                      type="button"
                      className="tile"
                      aria-pressed={selected}
                      onClick={() => toggle(word)}
                      style={
                        {
                          "--i": index,
                          "--hop": selectedInOrder.indexOf(word),
                        } as CSSProperties
                      }
                    >
                      <span className="tile-deal">
                        <span className={face.join(" ")}>
                          <span className="tile-text">{word}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
          </div>

          <div className="controls">
            <button
              type="button"
              className="btn secondary icon-only"
              onClick={shuffle}
              disabled={phase !== "idle" || !ready}
              aria-label="Stokk ordene"
              title="Stokk"
            >
              <ShuffleIcon />
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => dispatch({ type: "clear" })}
              disabled={phase !== "idle" || state.selected.length === 0}
            >
              Fjern valg
            </button>
            <button
              type="button"
              className={
                isFull && !isRepeat && phase === "idle"
                  ? "btn primary submit armed"
                  : "btn primary submit"
              }
              onClick={submit}
              disabled={phase !== "idle" || !isFull}
            >
              Send inn
              <span className="meter" aria-hidden="true">
                {Array.from({ length: WORDS_PER_GROUP }, (_, index) => (
                  <span key={index} className={index < state.selected.length ? "on" : undefined} />
                ))}
              </span>
            </button>
          </div>

          <div className="footer-row">
            <span className="hint">
              {state.guesses.length === 0 && state.selected.length === 0
                ? "velg fire ord som hører sammen"
                : isRepeat
                  ? "prøvd før, bytt ut et ord"
                  : `${state.selected.length} av 4 valgt`}
            </span>
            <button
              type="button"
              className={confirmGiveUp ? "btn-link danger" : "btn-link"}
              onClick={giveUp}
              disabled={phase !== "idle"}
            >
              {confirmGiveUp ? "trykk igjen for å gi opp" : "gi opp"}
            </button>
          </div>
        </>
      )}

      {isOver && ready && (
        <ResultCard state={state} date={date} level={level} levels={levels} onShare={share} />
      )}

      <div className="toast-layer" role="status" aria-live="polite">
        {toast && (
          <span key={toast.id} className={`toast ${toast.tone}`}>
            {toast.text}
          </span>
        )}
      </div>

      {celebrate && <Confetti />}
    </section>
  );
}
