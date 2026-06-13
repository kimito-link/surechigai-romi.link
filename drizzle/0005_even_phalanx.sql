CREATE TABLE `challenge_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`goalType` enum('attendance','followers','viewers','points','custom') NOT NULL DEFAULT 'attendance',
	`goalValue` int NOT NULL DEFAULT 100,
	`goalUnit` varchar(32) NOT NULL DEFAULT '人',
	`eventType` enum('solo','group') NOT NULL DEFAULT 'solo',
	`ticketPresale` int,
	`ticketDoor` int,
	`isPublic` boolean NOT NULL DEFAULT false,
	`useCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `challenge_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`fromUserName` varchar(255) NOT NULL,
	`fromUserImage` text,
	`toUserId` int NOT NULL,
	`message` text NOT NULL,
	`challengeId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`reminderType` enum('day_before','day_of','hour_before','custom') NOT NULL DEFAULT 'day_before',
	`customTime` timestamp,
	`isSent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
