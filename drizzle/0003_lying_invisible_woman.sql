CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconUrl` text,
	`type` enum('participation','achievement','milestone','special') NOT NULL DEFAULT 'participation',
	`conditionType` enum('first_participation','goal_reached','milestone_25','milestone_50','milestone_75','contribution_5','contribution_10','contribution_20','host_challenge','special') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picked_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participationId` int NOT NULL,
	`challengeId` int NOT NULL,
	`pickedBy` int NOT NULL,
	`reason` text,
	`isUsedInVideo` boolean NOT NULL DEFAULT false,
	`pickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `picked_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`challengeId` int,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
