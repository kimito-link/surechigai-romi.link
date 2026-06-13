CREATE TABLE `twitter_user_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`twitterUsername` varchar(255) NOT NULL,
	`twitterId` varchar(64),
	`displayName` varchar(255),
	`profileImage` text,
	`followersCount` int DEFAULT 0,
	`description` text,
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twitter_user_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `twitter_user_cache_twitterUsername_unique` UNIQUE(`twitterUsername`)
);
--> statement-breakpoint
CREATE TABLE `challenge_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`twitterUsername` varchar(255) NOT NULL,
	`twitterId` varchar(64),
	`displayName` varchar(255),
	`profileImage` text,
	`followersCount` int DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenge_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorite_artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userTwitterId` varchar(64),
	`artistTwitterId` varchar(64) NOT NULL,
	`artistName` varchar(255),
	`artistUsername` varchar(255),
	`artistProfileImage` text,
	`notifyNewChallenge` boolean NOT NULL DEFAULT true,
	`expoPushToken` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_artists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userUsername` varchar(255),
	`userImage` text,
	`ticketCount` int NOT NULL DEFAULT 1,
	`priceType` enum('face_value','negotiable','free') NOT NULL DEFAULT 'face_value',
	`comment` text,
	`status` enum('available','reserved','completed','cancelled') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userUsername` varchar(255),
	`userImage` text,
	`desiredCount` int NOT NULL DEFAULT 1,
	`notifyOnNew` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_waitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(36) NOT NULL,
	`action` enum('CREATE','EDIT','DELETE','RESTORE','BULK_DELETE','BULK_RESTORE','LOGIN','LOGOUT','ADMIN_ACTION') NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`targetId` int,
	`actorId` int,
	`actorName` varchar(255),
	`actorRole` varchar(32),
	`beforeData` json,
	`afterData` json,
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `conditionType` enum('first_participation','goal_reached','milestone_25','milestone_50','milestone_75','contribution_5','contribution_10','contribution_20','host_challenge','special','follower_badge') NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `twitterId` varchar(64);--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `twitterUsername` varchar(255);--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `isConfirmed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `invitations` ADD `customMessage` text;--> statement-breakpoint
ALTER TABLE `invitations` ADD `customTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `participations` ADD `followersCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `participations` ADD `gender` enum('male','female','unspecified') DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `participations` ADD `attendanceType` enum('venue','streaming','both') DEFAULT 'venue' NOT NULL;--> statement-breakpoint
ALTER TABLE `participations` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `participations` ADD `deletedBy` int;