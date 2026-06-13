CREATE TABLE `achievement_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`achievedAt` timestamp NOT NULL,
	`finalValue` int NOT NULL,
	`goalValue` int NOT NULL,
	`totalParticipants` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievement_pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cheers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`fromUserName` varchar(255) NOT NULL,
	`fromUserImage` text,
	`toParticipationId` int NOT NULL,
	`toUserId` int,
	`message` text,
	`emoji` varchar(32) NOT NULL DEFAULT '👏',
	`challengeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cheers_id` PRIMARY KEY(`id`)
);
