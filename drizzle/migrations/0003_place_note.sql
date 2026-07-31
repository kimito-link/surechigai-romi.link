ALTER TABLE "locations" ADD COLUMN "placeName" varchar(120);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "noteUpdatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "locationId" integer;