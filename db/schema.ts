import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const puzzleStatus = pgEnum("puzzle_status", [
  "suggested",
  "draft",
  "approved",
]);

export const puzzles = pgTable(
  "puzzles",
  {
    id: serial("id").primaryKey(),
    // `date` (not timestamp): one puzzle per calendar day, enforced by UNIQUE.
    publishDate: date("publish_date").notNull(),
    status: puzzleStatus("status").notNull().default("suggested"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("puzzles_publish_date_unique").on(table.publishDate),
    // Fast lookup of the approved puzzle for a day.
    index("puzzles_approved_publish_date_idx")
      .on(table.publishDate)
      .where(sql`${table.status} = 'approved'`),
  ],
);

export const puzzleGroups = pgTable(
  "puzzle_groups",
  {
    id: serial("id").primaryKey(),
    puzzleId: integer("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    difficulty: smallint("difficulty").notNull(),
    name: text("name").notNull(),
    words: text("words").array().notNull(),
  },
  (table) => [
    unique("puzzle_groups_puzzle_difficulty_unique").on(
      table.puzzleId,
      table.difficulty,
    ),
    check(
      "puzzle_groups_difficulty_check",
      sql`${table.difficulty} BETWEEN 1 AND 4`,
    ),
    check(
      "puzzle_groups_words_cardinality_check",
      sql`cardinality(${table.words}) = 4`,
    ),
  ],
);

export type PuzzleRow = typeof puzzles.$inferSelect;
export type PuzzleGroupRow = typeof puzzleGroups.$inferSelect;
