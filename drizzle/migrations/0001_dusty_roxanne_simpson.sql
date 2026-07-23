ALTER TABLE "locations" ADD COLUMN "h3R7" text;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "h3R5" text;--> statement-breakpoint
CREATE INDEX "locations_h3R7_recordedAt_idx" ON "locations" USING btree ("h3R7","recordedAt");--> statement-breakpoint
CREATE INDEX "locations_h3R5_recordedAt_idx" ON "locations" USING btree ("h3R5","recordedAt");