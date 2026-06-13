CREATE TABLE `ticket_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userUsername` varchar(255),
	`userImage` text,
	`ticketCount` int NOT NULL DEFAULT 1,
	`priceType` enum('face_value','negotiable','free') NOT NULL DEFAULT 'face_value',
	`comment` text,
	`status` enum('available','reserved','completed','cancelled') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_waitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userUsername` varchar(255),
	`userImage` text,
	`desiredCount` int NOT NULL DEFAULT 1,
	`notifyOnNew` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_waitlist_id` PRIMARY KEY(`id`)
);
