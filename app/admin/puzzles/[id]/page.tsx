import { notFound } from "next/navigation";
import { PuzzleForm } from "@/app/admin/puzzle-form";
import { getPuzzleById } from "@/lib/puzzle/queries";

export const dynamic = "force-dynamic";

export default async function EditPuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const puzzleId = Number(id);
  if (!Number.isInteger(puzzleId) || puzzleId <= 0) notFound();

  const puzzle = await getPuzzleById(puzzleId);
  if (!puzzle) notFound();

  return (
    <section className="admin-panel">
      <h2>Rediger oppgave</h2>
      <PuzzleForm puzzle={puzzle} />
    </section>
  );
}
