CREATE TABLE `participation_companions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participationId` int NOT NULL,
	`challengeId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`twitterUsername` varchar(255),
	`twitterId` varchar(64),
	`profileImage` text,
	`invitedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participation_companions_id` PRIMARY KEY(`id`)
);
