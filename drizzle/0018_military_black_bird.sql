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
