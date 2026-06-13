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
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"gender" "gender" DEFAULT 'unspecified' NOT NULL,
	"prefecture" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"icon" varchar(32) DEFAULT '🎤' NOT NULL,
	"color" varchar(16) DEFAULT '#EC4899' NOT NULL,
	"description" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "challenge_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"twitterUsername" varchar(255) NOT NULL,
	"twitterId" varchar(64),
	"displayName" varchar(255),
	"profileImage" text,
	"followersCount" integer DEFAULT 0,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"recordDate" varchar(10) NOT NULL,
	"recordHour" integer DEFAULT 0 NOT NULL,
	"participantCount" integer DEFAULT 0 NOT NULL,
	"totalContribution" integer DEFAULT 0 NOT NULL,
	"newParticipants" integer DEFAULT 0 NOT NULL,
	"prefectureData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"goalType" "goalType" DEFAULT 'attendance' NOT NULL,
	"goalValue" integer DEFAULT 100 NOT NULL,
	"goalUnit" varchar(32) DEFAULT '人' NOT NULL,
	"eventType" "eventType" DEFAULT 'solo' NOT NULL,
	"ticketPresale" integer,
	"ticketDoor" integer,
	"isPublic" boolean DEFAULT false NOT NULL,
	"useCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"hostUserId" integer,
	"hostTwitterId" varchar(64),
	"hostName" varchar(255) NOT NULL,
	"hostUsername" varchar(255),
	"hostProfileImage" text,
	"hostFollowersCount" integer DEFAULT 0,
	"hostDescription" text,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255),
	"description" text,
	"goalType" "goalType" DEFAULT 'attendance' NOT NULL,
	"goalValue" integer DEFAULT 100 NOT NULL,
	"goalUnit" varchar(32) DEFAULT '人' NOT NULL,
	"currentValue" integer DEFAULT 0 NOT NULL,
	"eventType" "eventType" DEFAULT 'solo' NOT NULL,
	"categoryId" integer,
	"eventDate" timestamp NOT NULL,
	"venue" varchar(255),
	"prefecture" varchar(32),
	"ticketPresale" integer,
	"ticketDoor" integer,
	"ticketSaleStart" timestamp,
	"ticketUrl" text,
	"externalUrl" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"aiSummary" text,
	"intentTags" jsonb,
	"regionSummary" jsonb,
	"participantSummary" jsonb,
	"aiSummaryUpdatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "participation_companions" (
	"id" serial PRIMARY KEY NOT NULL,
	"participationId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"twitterUsername" varchar(255),
	"twitterId" varchar(64),
	"profileImage" text,
	"invitedByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer,
	"twitterId" varchar(64),
	"displayName" varchar(255) NOT NULL,
	"username" varchar(255),
	"profileImage" text,
	"followersCount" integer DEFAULT 0,
	"message" text,
	"companionCount" integer DEFAULT 0 NOT NULL,
	"prefecture" varchar(32),
	"gender" "gender" DEFAULT 'unspecified' NOT NULL,
	"contribution" integer DEFAULT 1 NOT NULL,
	"isAnonymous" boolean DEFAULT false NOT NULL,
	"attendanceType" "attendanceType" DEFAULT 'venue' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	"deletedBy" integer
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"onGoalReached" boolean DEFAULT true NOT NULL,
	"onMilestone25" boolean DEFAULT true NOT NULL,
	"onMilestone50" boolean DEFAULT true NOT NULL,
	"onMilestone75" boolean DEFAULT true NOT NULL,
	"onNewParticipant" boolean DEFAULT false NOT NULL,
	"expoPushToken" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"reminderType" "reminderType" DEFAULT 'day_before' NOT NULL,
	"customTime" timestamp,
	"isSent" boolean DEFAULT false NOT NULL,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cheers" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromUserId" integer NOT NULL,
	"fromUserName" varchar(255) NOT NULL,
	"fromUserImage" text,
	"toParticipationId" integer NOT NULL,
	"toUserId" integer,
	"message" text,
	"emoji" varchar(32) DEFAULT '👏' NOT NULL,
	"challengeId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromUserId" integer NOT NULL,
	"fromUserName" varchar(255) NOT NULL,
	"fromUserImage" text,
	"toUserId" integer NOT NULL,
	"message" text NOT NULL,
	"challengeId" integer NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"userTwitterId" varchar(64),
	"artistTwitterId" varchar(64) NOT NULL,
	"artistName" varchar(255),
	"artistUsername" varchar(255),
	"artistProfileImage" text,
	"notifyNewChallenge" boolean DEFAULT true NOT NULL,
	"expoPushToken" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followerName" varchar(255),
	"followeeId" integer NOT NULL,
	"followeeName" varchar(255),
	"followeeImage" text,
	"notifyNewChallenge" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"query" varchar(255) NOT NULL,
	"resultCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"achievedAt" timestamp NOT NULL,
	"finalValue" integer NOT NULL,
	"goalValue" integer NOT NULL,
	"totalParticipants" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"iconUrl" text,
	"icon" varchar(32) DEFAULT '🏆' NOT NULL,
	"type" "achievement_type" DEFAULT 'participation' NOT NULL,
	"conditionType" "achievement_condition_type" NOT NULL,
	"conditionValue" integer DEFAULT 1 NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"rarity" "rarity" DEFAULT 'common' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"iconUrl" text,
	"type" "badge_type" DEFAULT 'participation' NOT NULL,
	"conditionType" "badge_condition_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picked_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"participationId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"pickedBy" integer NOT NULL,
	"reason" text,
	"isUsedInVideo" boolean DEFAULT false NOT NULL,
	"pickedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementId" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"badgeId" integer NOT NULL,
	"challengeId" integer,
	"earnedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborator_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"inviterId" integer NOT NULL,
	"inviterName" varchar(255),
	"inviteeId" integer,
	"inviteeEmail" varchar(320),
	"inviteeTwitterId" varchar(64),
	"code" varchar(32) NOT NULL,
	"role" "collaborator_invite_role" DEFAULT 'co-host' NOT NULL,
	"status" "collaborator_invite_status" DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collaborator_invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"userName" varchar(255) NOT NULL,
	"userImage" text,
	"role" "collaborator_role" DEFAULT 'co-host' NOT NULL,
	"canEdit" boolean DEFAULT true NOT NULL,
	"canManageParticipants" boolean DEFAULT true NOT NULL,
	"canInvite" boolean DEFAULT true NOT NULL,
	"status" "collaborator_status" DEFAULT 'pending' NOT NULL,
	"invitedAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"invitationId" integer NOT NULL,
	"userId" integer,
	"displayName" varchar(255),
	"twitterId" varchar(64),
	"twitterUsername" varchar(255),
	"participationId" integer,
	"isConfirmed" boolean DEFAULT false NOT NULL,
	"confirmedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"inviterId" integer NOT NULL,
	"inviterName" varchar(255),
	"code" varchar(32) NOT NULL,
	"customMessage" text,
	"customTitle" varchar(255),
	"maxUses" integer DEFAULT 0,
	"useCount" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ticket_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"userName" varchar(255) NOT NULL,
	"userUsername" varchar(255),
	"userImage" text,
	"ticketCount" integer DEFAULT 1 NOT NULL,
	"priceType" "priceType" DEFAULT 'face_value' NOT NULL,
	"comment" text,
	"status" "ticket_status" DEFAULT 'available' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"userName" varchar(255) NOT NULL,
	"userUsername" varchar(255),
	"userImage" text,
	"desiredCount" integer DEFAULT 1 NOT NULL,
	"notifyOnNew" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" varchar(36) NOT NULL,
	"action" "audit_action" NOT NULL,
	"entityType" varchar(64) NOT NULL,
	"targetId" integer,
	"actorId" integer,
	"actorName" varchar(255),
	"actorRole" varchar(32),
	"beforeData" jsonb,
	"afterData" jsonb,
	"reason" text,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" varchar(32) NOT NULL,
	"date" varchar(32) NOT NULL,
	"title" text NOT NULL,
	"changes" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
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
	"rateLimitInfo" jsonb,
	"month" varchar(7) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "month_idx" ON "api_usage" USING btree ("month");--> statement-breakpoint
CREATE INDEX "endpoint_idx" ON "api_usage" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "api_usage" USING btree ("createdAt");