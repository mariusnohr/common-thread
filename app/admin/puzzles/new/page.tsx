import { PuzzleForm } from "@/app/admin/puzzle-form";

export default function NewPuzzlePage() {
  return (
    <section className="admin-panel">
      <h2>Ny oppgave</h2>
      <PuzzleForm />
    </section>
  );
}
