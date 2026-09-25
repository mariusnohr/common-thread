"use client";

import { useEffect, useRef } from "react";
import { hasSeenHelp, markHelpSeen } from "@/lib/game/storage";
import { MAX_MISTAKES } from "@/lib/puzzle/reducer";
import { CloseIcon, HeartIcon, HelpIcon, StarIcon } from "./icons";

const EXAMPLES = [
  { difficulty: 1, name: "Frukt", words: "eple, pære, plomme, kiwi", hint: "lettest" },
  { difficulty: 2, name: "Norske byer", words: "bodø, molde, hamar, halden", hint: "" },
  { difficulty: 3, name: "___kake", words: "bløt, pepper, gulrot, sjokolade", hint: "" },
  { difficulty: 4, name: "Sjakkbrikker", words: "konge, dronning, løper, tårn", hint: "vanskeligst" },
];

/** The «?» button in the header, and the rules it opens. Opens by itself on a first visit. */
export function HelpButton() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open && !hasSeenHelp()) element.showModal();
  }, []);

  function close() {
    markHelpSeen();
    dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label="Slik spiller du"
        onClick={() => dialog.current?.showModal()}
      >
        <HelpIcon />
      </button>

      <dialog
        ref={dialog}
        className="sheet"
        aria-labelledby="help-title"
        onClose={markHelpSeen}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="sheet-body">
          <button type="button" className="icon-button sheet-close" aria-label="Lukk" onClick={close}>
            <CloseIcon />
          </button>
          <h2 id="help-title">Slik spiller du</h2>
          <p className="lead">
            Seksten ord skjuler fire grupper på fire. Finn tråden som binder dem sammen.
          </p>

          <ol className="rules">
            <li>Velg fire ord du tror hører sammen, og trykk <strong>send inn</strong>.</li>
            <li>
              Du har <HeartIcon className="inline-icon heart-inline" /> {MAX_MISTAKES} liv. Hver
              feil koster ett.
            </li>
            <li>Er tre av fire riktige, får du beskjed om at du er én unna.</li>
            <li>
              Liv du har igjen blir til <StarIcon className="inline-icon star-inline" /> stjerner.
              Feilfritt gir tre.
            </li>
          </ol>

          <div className="legend" aria-label="Eksempel på grupper">
            {EXAMPLES.map((example) => (
              <div key={example.difficulty} className={`legend-row g-${example.difficulty}`}>
                <strong>{example.name}</strong>
                <span>{example.words}</span>
                {example.hint && <em>{example.hint}</em>}
              </div>
            ))}
          </div>

          <p className="muted small">
            Nye oppgaver hver dag ved midnatt: lett, middels og vanskelig. Samle en rekke ved å løse
            minst én hver dag.
          </p>

          <button type="button" className="btn primary wide" onClick={close}>
            Spill
          </button>
        </div>
      </dialog>
    </>
  );
}
