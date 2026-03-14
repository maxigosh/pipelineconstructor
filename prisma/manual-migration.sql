-- Run this in the Supabase SQL Editor if prisma db push is not available.
-- This adds the is_template column that exists in schema.prisma but not in the database.

ALTER TABLE "Pipeline" ADD COLUMN IF NOT EXISTS "is_template" BOOLEAN NOT NULL DEFAULT false;
