CREATE TABLE `twitter_follow_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`twitterId` varchar(64) NOT NULL,
	`twitterUsername` varchar(255),
	`targetTwitterId` varchar(64) NOT NULL,
	`targetUsername` varchar(255) NOT NULL,
	`isFollowing` boolean NOT NULL DEFAULT false,
	`lastCheckedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twitter_follow_status_id` PRIMARY KEY(`id`)
);
