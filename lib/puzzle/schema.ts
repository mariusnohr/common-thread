import { z } from "zod";

const wordsSchema = z.array(z.string().trim().min(1)).length(4);

export const puzzleGroupSchema = z.object({
  difficulty: z.number().int().min(1).max(4),
  name: z.string().trim().min(1),
  words: wordsSchema,
});

/**
 * Validates a puzzle before it is written to the database. The database
 * enforces the per-row rules (four words, difficulty 1-4, unique
 * puzzle/difficulty), while the "four groups and 16 unique words" rule lives
 * here in application code.
 */
export const puzzleSchema = z
  .object({
    groups: z.array(puzzleGroupSchema).length(4),
  })
  .superRefine((puzzle, ctx) => {
    const difficulties = puzzle.groups.map((group) => group.difficulty);
    if (new Set(difficulties).size !== difficulties.length) {
      ctx.addIssue({
        code: "custom",
        message: "Hver vanskelighetsgrad kan bare brukes én gang",
        path: ["groups"],
      });
    }

    const words = puzzle.groups.flatMap((group) => group.words);
    if (new Set(words).size !== 16) {
      ctx.addIssue({
        code: "custom",
        message: "Alle 16 ordene må være unike",
        path: ["groups"],
      });
    }
  });

export type PuzzleInput = z.infer<typeof puzzleSchema>;
