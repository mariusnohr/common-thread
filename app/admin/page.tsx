import Link from "next/link";
import { StatusForm } from "./status-form";
import { puzzleNumberForDate } from "@/lib/puzzle/number";
import { addDays, todayInOslo } from "@/lib/puzzle/oslo";
import { listPuzzles } from "@/lib/puzzle/queries";
import type { PuzzleStatus } from "@/lib/puzzle/types";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<PuzzleStatus, string> = {
  suggested: "Foreslått",
  draft: "Utkast",
  approved: "Godkjent",
};

const UPCOMING_DAYS = 30;

export default async function AdminOverviewPage() {
  const puzzles = await listPuzzles();
  const launchDate = process.env.LAUNCH_DATE;
  const today = todayInOslo();

  const approvedDates = new Set(
    puzzles
      .filter((puzzle) => puzzle.status === "approved")
      .map((puzzle) => puzzle.publishDate),
  );

  const missingDates: string[] = [];
  for (let offset = 0; offset < UPCOMING_DAYS; offset += 1) {
    const date = addDays(today, offset);
    if (!approvedDates.has(date)) missingDates.push(date);
  }

  return (
    <section className="admin-panel">
      <div className="admin-actions">
        <Link className="button" href="/admin/puzzles/new">
          Ny oppgave
        </Link>
      </div>

      {missingDates.length > 0 ? (
        <div className="notice">
          <strong>Dager uten godkjent oppgave neste 30 dager:</strong>{" "}
          {missingDates.join(", ")}
        </div>
      ) : (
        <div className="notice ok">
          Alle de neste 30 dagene har en godkjent oppgave.
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
