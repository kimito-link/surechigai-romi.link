ALTER TABLE `invitation_uses` ADD `twitterId` varchar(64);--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `twitterUsername` varchar(255);--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `isConfirmed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_uses` ADD `confirmedAt` timestamp;