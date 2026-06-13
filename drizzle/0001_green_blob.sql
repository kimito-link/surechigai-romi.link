CREATE TABLE `events` (
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
	`eventDate` timestamp NOT NULL,
	`venue` varchar(255),
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int,
	`twitterId` varchar(64),
	`displayName` varchar(255) NOT NULL,
	`username` varchar(255),
	`profileImage` text,
	`message` text,
	`companionCount` int NOT NULL DEFAULT 0,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participations_id` PRIMARY KEY(`id`)
);
