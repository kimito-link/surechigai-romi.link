ALTER TABLE `challenges` ADD `aiSummary` text;--> statement-breakpoint
ALTER TABLE `challenges` ADD `intentTags` json;--> statement-breakpoint
ALTER TABLE `challenges` ADD `regionSummary` json;--> statement-breakpoint
ALTER TABLE `challenges` ADD `participantSummary` json;--> statement-breakpoint
ALTER TABLE `challenges` ADD `aiSummaryUpdatedAt` timestamp;