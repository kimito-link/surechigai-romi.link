ALTER TABLE "event_participations" ADD COLUMN IF NOT EXISTS "reminderEnabled" boolean DEFAULT true NOT NULL;
