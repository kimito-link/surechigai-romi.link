ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "creatorProfileImage" text;

CREATE TABLE IF NOT EXISTS "event_participations" (
  "id" serial PRIMARY KEY NOT NULL,
  "eventId" integer NOT NULL,
  "userId" integer NOT NULL,
  "displayName" text NOT NULL,
  "username" varchar(255),
  "profileImage" text,
  "message" text,
  "prefecture" varchar(32),
  "companionCount" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "deletedAt" timestamp
);

CREATE INDEX IF NOT EXISTS "event_participations_eventId_idx" ON "event_participations" ("eventId");
CREATE INDEX IF NOT EXISTS "event_participations_userId_idx" ON "event_participations" ("userId");
CREATE INDEX IF NOT EXISTS "event_participations_event_user_idx" ON "event_participations" ("eventId", "userId");
