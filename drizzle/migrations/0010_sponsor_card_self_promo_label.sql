ALTER TABLE "sponsor_cards"
  ADD COLUMN IF NOT EXISTS "isSelfPromo" boolean DEFAULT false NOT NULL;
