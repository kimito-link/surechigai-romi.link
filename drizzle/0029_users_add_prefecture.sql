-- Add prefecture to users table (for 1-Click participation / profile)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prefecture" varchar(32);
