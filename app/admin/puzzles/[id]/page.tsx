import { notFound } from "next/navigation";
import { RegenerateForm } from "@/app/admin/generate-form";
import { PuzzleForm } from "@/app/admin/puzzle-form";
import { describeAiConfig } from "@/lib/ai/model";
import { getPuzzleById } from "@/lib/puzzle/queries";

export const dynamic = "force-dynamic";

export default async function EditPuzzlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generert?: string }>;
}) {
  const { id } = await params;
  const { generert } = await searchParams;
  const puzzleId = Number(id);
  if (!Number.isInteger(puzzleId) || puzzleId <= 0) notFound();

  const puzzle = await getPuzzleById(puzzleId);
  if (!puzzle) notFound();

  return (
    <section className="admin-panel">
      <h2>Rediger oppgave</h2>

      {generert === "1" && (
        <div className="notice info">
          Nytt AI-forslag. Sjekk at hvert ord bare passer i én gruppe, rett
          det som trengs og sett status til godkjent.
        </div>
      )}

      {puzzle.status !== "approved" && (
        <RegenerateForm ai={describeAiConfig()} puzzleId={puzzle.id} />
      )}

      {/* `key` remounts the editor after a regeneration so its inputs show
          the new groups instead of the previous default values. */}
      <PuzzleForm
        key={puzzle.groups.map((group) => group.words.join()).join("|")}
        puzzle={puzzle}
      />
    </section>
  );
}
