CREATE TYPE "public"."puzzle_status" AS ENUM('suggested', 'draft', 'approved');--> statement-breakpoint
CREATE TABLE "puzzle_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"puzzle_id" integer NOT NULL,
	"difficulty" smallint NOT NULL,
	"name" text NOT NULL,
	"words" text[] NOT NULL,
	CONSTRAINT "puzzle_groups_puzzle_difficulty_unique" UNIQUE("puzzle_id","difficulty"),
	CONSTRAINT "puzzle_groups_difficulty_check" CHECK ("puzzle_groups"."difficulty" BETWEEN 1 AND 4),
	CONSTRAINT "puzzle_groups_words_cardinality_check" CHECK (cardinality("puzzle_groups"."words") = 4)
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"publish_date" date NOT NULL,
	"status" "puzzle_status" DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "puzzles_publish_date_unique" UNIQUE("publish_date")
);
--> statement-breakpoint
ALTER TABLE "puzzle_groups" ADD CONSTRAINT "puzzle_groups_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "puzzles_approved_publish_date_idx" ON "puzzles" USING btree ("publish_date") WHERE "puzzles"."status" = 'approved';