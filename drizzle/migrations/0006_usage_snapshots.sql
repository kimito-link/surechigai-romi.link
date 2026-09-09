CREATE TABLE "usage_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"capturedAt" timestamp DEFAULT now() NOT NULL,
	"totalUsers" bigint NOT NULL,
	"activeUsers7d" bigint NOT NULL,
	"activeUsers30d" bigint NOT NULL,
	"usersWithLocations" bigint NOT NULL,
	"activeLoggers7d" bigint NOT NULL,
	"placeNotes" bigint NOT NULL,
	"encounters" bigint NOT NULL,
	"events" bigint NOT NULL,
	"participations" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "usage_snapshots_capturedAt_idx" ON "usage_snapshots" USING btree ("capturedAt");