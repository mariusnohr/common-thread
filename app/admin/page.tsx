import Link from "next/link";
import { GenerateForm } from "./generate-form";
import { StatusForm } from "./status-form";
import { describeAiConfig } from "@/lib/ai/model";
import { LEVEL_LABELS, PUZZLE_LEVELS } from "@/lib/puzzle/levels";
import { puzzleNumberForDate } from "@/lib/puzzle/number";
import { addDays, todayInOslo } from "@/lib/puzzle/oslo";
import { listPuzzles } from "@/lib/puzzle/queries";
import type { PuzzleLevel, PuzzleStatus } from "@/lib/puzzle/types";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<PuzzleStatus, string> = {
  suggested: "Foreslått",
  draft: "Utkast",
  approved: "Godkjent",
};

const UPCOMING_DAYS = 30;

type OpenSlot = {
  level: PuzzleLevel;
  /** Status of the puzzle waiting in the slot, or `null` if it is empty. */
  status: PuzzleStatus | null;
};

export default async function AdminOverviewPage() {
  const puzzles = await listPuzzles();
  const launchDate = process.env.LAUNCH_DATE;
  const today = todayInOslo();

  const statusBySlot = new Map(
    puzzles.map((puzzle) => [
      `${puzzle.publishDate}:${puzzle.level}`,
      puzzle.status,
    ]),
  );

  // Every upcoming day/level without an approved puzzle.
  const openDays: { date: string; slots: OpenSlot[] }[] = [];
  let firstEmpty: { date: string; level: PuzzleLevel } | null = null;
  for (let offset = 0; offset < UPCOMING_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const slots: OpenSlot[] = [];
    for (const level of PUZZLE_LEVELS) {
      const status = statusBySlot.get(`${date}:${level}`) ?? null;
      if (status === "approved") continue;
      slots.push({ level, status });
      if (status === null) firstEmpty ??= { date, level };
    }
    if (slots.length > 0) openDays.push({ date, slots });
  }

  return (
    <section className="admin-panel">
      <div className="admin-actions">
        <Link className="button" href="/admin/puzzles/new">
          Ny oppgave
        </Link>
      </div>

      <GenerateForm
        ai={describeAiConfig()}
        defaultDate={firstEmpty?.date ?? today}
        defaultLevel={firstEmpty?.level ?? "easy"}
      />

      {openDays.length > 0 ? (
        <div className="notice">
          <strong>Uten godkjent oppgave de neste 30 dagene:</strong>
          <ul className="open-slots">
            {openDays.map(({ date, slots }) => (
              <li key={date}>
                <span className="open-date">{date}</span>{" "}
                {slots.length === PUZZLE_LEVELS.length &&
                slots.every((slot) => slot.status === null)
                  ? "alle nivåer"
                  : slots
                      .map((slot) =>
                        slot.status
                          ? `${LEVEL_LABELS[slot.level].toLowerCase()} (${STATUS_LABELS[slot.status].toLowerCase()})`
                          : LEVEL_LABELS[slot.level].toLowerCase(),
                      )
                      .join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="notice ok">
          Alle nivåer har en godkjent oppgave de neste 30 dagene.
        </div>
      )}

      {puzzles.length === 0 ? (
        <p className="empty">Ingen oppgaver i databasen ennå.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Nr.</th>
              <th>Nivå</th>
              <th>Status</th>
              <th>Grupper</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {puzzles.map((puzzle) => (
              <tr key={puzzle.id}>
                <td>
                  <Link href={`/admin/puzzles/${puzzle.id}`}>
                    {puzzle.publishDate}
                  </Link>
                </td>
                <td>{puzzleNumberForDate(launchDate, puzzle.publishDate) ?? "–"}</td>
                <td>{LEVEL_LABELS[puzzle.level]}</td>
                <td>
                  <span className={`status status-${puzzle.status}`}>
                    {STATUS_LABELS[puzzle.status]}
                  </span>
                </td>
                <td>{puzzle.groups.map((group) => group.name).join(" · ")}</td>
                <td>
                  <StatusForm id={puzzle.id} status={puzzle.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
