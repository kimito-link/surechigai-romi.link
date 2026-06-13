CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostUserId` int,
	`hostTwitterId` varchar(64),
	`hostName` varchar(255) NOT NULL,
	`hostUsername` varchar(255),
	`hostProfileImage` text,
	`hostFollowersCount` int DEFAULT 0,
	`hostDescription` text,
	`title` varchar(255) NOT NULL,
	`description` text,
	`goalType` enum('attendance','followers','viewers','points','custom') NOT NULL DEFAULT 'attendance',
	`goalValue` int NOT NULL DEFAULT 100,
	`goalUnit` varchar(32) NOT NULL DEFAULT '人',
	`currentValue` int NOT NULL DEFAULT 0,
	`eventType` enum('solo','group') NOT NULL DEFAULT 'solo',
	`eventDate` timestamp NOT NULL,
	`venue` varchar(255),
	`prefecture` varchar(32),
	`ticketPresale` int,
	`ticketDoor` int,
	`ticketSaleStart` timestamp,
	`ticketUrl` text,
	`externalUrl` text,
	`status` enum('upcoming','active','ended') NOT NULL DEFAULT 'active',
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`onGoalReached` boolean NOT NULL DEFAULT true,
	`onMilestone25` boolean NOT NULL DEFAULT true,
	`onMilestone50` boolean NOT NULL DEFAULT true,
	`onMilestone75` boolean NOT NULL DEFAULT true,
	`onNewParticipant` boolean NOT NULL DEFAULT false,
	`expoPushToken` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`type` enum('goal_reached','milestone_25','milestone_50','milestone_75','new_participant') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
ALTER TABLE `participations` RENAME COLUMN `eventId` TO `challengeId`;--> statement-breakpoint
ALTER TABLE `participations` ADD `prefecture` varchar(32);--> statement-breakpoint
ALTER TABLE `participations` ADD `contribution` int DEFAULT 1 NOT NULL;