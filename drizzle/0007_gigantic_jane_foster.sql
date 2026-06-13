CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`icon` varchar(32) NOT NULL DEFAULT '🎤',
	`color` varchar(16) NOT NULL DEFAULT '#EC4899',
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `invitation_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` int NOT NULL,
	`userId` int,
	`displayName` varchar(255),
	`participationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_uses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`inviterId` int NOT NULL,
	`inviterName` varchar(255),
	`code` varchar(32) NOT NULL,
	`maxUses` int DEFAULT 0,
	`useCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `challenges` ADD `categoryId` int;