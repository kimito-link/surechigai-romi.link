ALTER TABLE "locations" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "trailVisibility" varchar(16) DEFAULT 'public' NOT NULL;
