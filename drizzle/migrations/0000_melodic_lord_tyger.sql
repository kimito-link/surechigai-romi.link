CREATE TABLE "oauth_pkce_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" varchar(64) NOT NULL,
	"codeVerifier" varchar(128) NOT NULL,
	"callbackUrl" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_pkce_data_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "twitter_follow_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"twitterId" varchar(64) NOT NULL,
	"twitterUsername" varchar(255),
	"targetTwitterId" varchar(64) NOT NULL,
	"targetUsername" varchar(255) NOT NULL,
	"isFollowing" boolean DEFAULT false NOT NULL,
	"lastCheckedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twitter_user_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"twitterUsername" varchar(255) NOT NULL,
	"twitterId" varchar(64),
	"displayName" varchar(255),
	"profileImage" text,
	"followersCount" integer DEFAULT 0,
	"description" text,
	"cachedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "twitter_user_cache_twitterUsername_unique" UNIQUE("twitterUsername")
);
--> statement-breakpoint
CREATE TABLE "user_twitter_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"encryptedAccessToken" text NOT NULL,
	"encryptedRefreshToken" text,
	"tokenExpiresAt" timestamp NOT NULL,
	"scope" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_twitter_tokens_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"gender" text DEFAULT 'unspecified' NOT NULL,
	"prefecture" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"hitokoto" text,
	"hitokotoUpdatedAt" timestamp,
	"isSuspended" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" varchar(36) NOT NULL,
	"action" text NOT NULL,
	"entityType" varchar(64) NOT NULL,
	"targetId" integer,
	"actorId" integer,
	"actorName" varchar(255),
	"actorRole" varchar(32),
	"beforeData" json,
	"afterData" json,
	"reason" text,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_cost_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"monthlyLimit" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"alertThreshold" numeric(10, 2) DEFAULT '8.00' NOT NULL,
	"alertEmail" varchar(320),
	"autoStop" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) DEFAULT 'GET' NOT NULL,
	"success" integer DEFAULT 1 NOT NULL,
	"cost" numeric(10, 4) DEFAULT '0' NOT NULL,
	"rateLimitInfo" json,
	"month" varchar(7) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blockerId" integer NOT NULL,
	"blockedId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"userAId" integer NOT NULL,
	"userBId" integer NOT NULL,
	"tier" integer NOT NULL,
	"h3R7" text,
	"areaName" text,
	"prefecture" varchar(32),
	"occurredAt" timestamp DEFAULT now() NOT NULL,
	"dayKey" varchar(10) NOT NULL,
	"openedByA" timestamp,
	"openedByB" timestamp
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"h3R8" text NOT NULL,
	"latGrid" real NOT NULL,
	"lngGrid" real NOT NULL,
	"municipality" text,
	"prefecture" varchar(32),
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"encounterId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"emoji" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporterId" integer NOT NULL,
	"targetUserId" integer NOT NULL,
	"encounterId" integer,
	"reason" text NOT NULL,
	"detail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"userId" integer PRIMARY KEY NOT NULL,
	"locationPausedUntil" timestamp,
	"homeMaskCell" text
);
--> statement-breakpoint
CREATE TABLE "visited_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"h3R7" text NOT NULL,
	"municipality" text,
	"prefecture" varchar(32),
	"firstVisitedAt" timestamp DEFAULT now() NOT NULL,
	"lastVisitedAt" timestamp DEFAULT now() NOT NULL,
	"visitCount" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"creatorId" integer NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" text,
	"typeTags" text DEFAULT '' NOT NULL,
	"locationType" text NOT NULL,
	"prefecture" varchar(32),
	"venueName" varchar(120),
	"onlineUrl" text,
	"startAt" timestamp NOT NULL,
	"endAt" timestamp,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"liveCheckinAt" timestamp,
	"visibility" text DEFAULT 'public' NOT NULL,
	"accessCodeHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_locationType_check" CHECK ("events"."locationType" IN ('online','offline')),
	CONSTRAINT "events_status_check" CHECK ("events"."status" IN ('upcoming','live','ended','canceled')),
	CONSTRAINT "events_visibility_check" CHECK ("events"."visibility" IN ('public','unlisted'))
);
--> statement-breakpoint
CREATE INDEX "month_idx" ON "api_usage" USING btree ("month");--> statement-breakpoint
CREATE INDEX "endpoint_idx" ON "api_usage" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "api_usage" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_pair_uidx" ON "blocks" USING btree ("blockerId","blockedId");--> statement-breakpoint
CREATE INDEX "blocks_blockerId_idx" ON "blocks" USING btree ("blockerId");--> statement-breakpoint
CREATE INDEX "blocks_blockedId_idx" ON "blocks" USING btree ("blockedId");--> statement-breakpoint
CREATE UNIQUE INDEX "encounters_pair_day_uidx" ON "encounters" USING btree ("userAId","userBId","dayKey");--> statement-breakpoint
CREATE INDEX "encounters_userA_idx" ON "encounters" USING btree ("userAId");--> statement-breakpoint
CREATE INDEX "encounters_userB_idx" ON "encounters" USING btree ("userBId");--> statement-breakpoint
CREATE INDEX "encounters_occurredAt_idx" ON "encounters" USING btree ("occurredAt");--> statement-breakpoint
CREATE INDEX "locations_h3R8_idx" ON "locations" USING btree ("h3R8");--> statement-breakpoint
CREATE INDEX "locations_userId_idx" ON "locations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "locations_recordedAt_idx" ON "locations" USING btree ("recordedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_encounter_sender_uidx" ON "reactions" USING btree ("encounterId","senderId");--> statement-breakpoint
CREATE INDEX "reactions_encounterId_idx" ON "reactions" USING btree ("encounterId");--> statement-breakpoint
CREATE INDEX "reports_targetUserId_idx" ON "reports" USING btree ("targetUserId");--> statement-breakpoint
CREATE INDEX "reports_reporterId_idx" ON "reports" USING btree ("reporterId");--> statement-breakpoint
CREATE UNIQUE INDEX "visited_areas_user_h3_uidx" ON "visited_areas" USING btree ("userId","h3R7");--> statement-breakpoint
CREATE INDEX "visited_areas_userId_idx" ON "visited_areas" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "visited_areas_h3R7_idx" ON "visited_areas" USING btree ("h3R7");--> statement-breakpoint
CREATE INDEX "events_creatorId_idx" ON "events" USING btree ("creatorId");--> statement-breakpoint
CREATE INDEX "events_status_startAt_idx" ON "events" USING btree ("status","startAt");--> statement-breakpoint
CREATE INDEX "events_prefecture_idx" ON "events" USING btree ("prefecture");