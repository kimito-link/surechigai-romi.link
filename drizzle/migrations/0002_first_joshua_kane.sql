DROP INDEX "event_participations_event_user_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "event_participations_event_user_uidx" ON "event_participations" USING btree ("eventId","userId");