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
