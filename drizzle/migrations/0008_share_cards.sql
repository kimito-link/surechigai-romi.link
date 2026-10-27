CREATE TABLE IF NOT EXISTS "share_cards" (
  "id" varchar(16) PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "areaText" varchar(80),
  "title" varchar(200) NOT NULL,
  "imageUrl" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_cards_userId_idx" ON "share_cards" ("userId");
