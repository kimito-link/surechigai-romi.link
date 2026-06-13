CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconUrl` text,
	`icon` varchar(32) NOT NULL DEFAULT '🏆',
	`type` enum('participation','hosting','invitation','contribution','streak','special') NOT NULL DEFAULT 'participation',
	`conditionType` enum('first_participation','participate_5','participate_10','participate_25','participate_50','first_host','host_5','host_10','invite_1','invite_5','invite_10','invite_25','contribution_10','contribution_50','contribution_100','streak_3','streak_7','streak_30','goal_reached','special') NOT NULL,
	`conditionValue` int NOT NULL DEFAULT 1,
	`points` int NOT NULL DEFAULT 10,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenge_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`recordDate` varchar(10) NOT NULL,
	`recordHour` int NOT NULL DEFAULT 0,
	`participantCount` int NOT NULL DEFAULT 0,
	`totalContribution` int NOT NULL DEFAULT 0,
	`newParticipants` int NOT NULL DEFAULT 0,
	`prefectureData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collaborator_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`inviterId` int NOT NULL,
	`inviterName` varchar(255),
	`inviteeId` int,
	`inviteeEmail` varchar(320),
	`inviteeTwitterId` varchar(64),
	`code` varchar(32) NOT NULL,
	`role` enum('co-host','moderator') NOT NULL DEFAULT 'co-host',
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collaborator_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `collaborator_invitations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userImage` text,
	`role` enum('owner','co-host','moderator') NOT NULL DEFAULT 'co-host',
	`canEdit` boolean NOT NULL DEFAULT true,
	`canManageParticipants` boolean NOT NULL DEFAULT true,
	`canInvite` boolean NOT NULL DEFAULT true,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collaborators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
