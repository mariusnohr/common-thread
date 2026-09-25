CREATE TYPE "public"."puzzle_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
ALTER TABLE "puzzles" DROP CONSTRAINT "puzzles_publish_date_unique";--> statement-breakpoint
ALTER TABLE "puzzles" ADD COLUMN "level" "puzzle_level" DEFAULT 'easy' NOT NULL;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_publish_date_level_unique" UNIQUE("publish_date","level");