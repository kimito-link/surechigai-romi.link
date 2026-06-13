CREATE TABLE `api_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) DEFAULT 'GET' NOT NULL,
	`success` int DEFAULT 1 NOT NULL,
	`cost` decimal(10,4) DEFAULT '0' NOT NULL,
	`rateLimitInfo` json,
	`month` varchar(7) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `month_idx` ON `api_usage` (`month`);
--> statement-breakpoint
CREATE INDEX `endpoint_idx` ON `api_usage` (`endpoint`);
--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `api_usage` (`createdAt`);
--> statement-breakpoint
CREATE TABLE `api_cost_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthlyLimit` decimal(10,2) DEFAULT '10.00' NOT NULL,
	`alertThreshold` decimal(10,2) DEFAULT '8.00' NOT NULL,
	`alertEmail` varchar(320),
	`autoStop` int DEFAULT 0 NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_cost_settings_id` PRIMARY KEY(`id`)
);
