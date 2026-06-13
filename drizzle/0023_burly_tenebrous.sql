CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(36) NOT NULL,
	`action` enum('CREATE','EDIT','DELETE','RESTORE','BULK_DELETE','BULK_RESTORE','LOGIN','LOGOUT','ADMIN_ACTION') NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`targetId` int,
	`actorId` int,
	`actorName` varchar(255),
	`actorRole` varchar(32),
	`beforeData` json,
	`afterData` json,
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
