ALTER TABLE "user_settings" ADD COLUMN "livePresenceEnabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "user_settings" ADD COLUMN "livePresenceLat" real;
ALTER TABLE "user_settings" ADD COLUMN "livePresenceLng" real;
ALTER TABLE "user_settings" ADD COLUMN "livePresenceMunicipality" text;
ALTER TABLE "user_settings" ADD COLUMN "livePresenceUpdatedAt" timestamp;
