DROP TABLE `twitter_user_cache`;--> statement-breakpoint
DROP TABLE `challenge_members`;--> statement-breakpoint
DROP TABLE `favorite_artists`;--> statement-breakpoint
DROP TABLE `ticket_transfers`;--> statement-breakpoint
DROP TABLE `ticket_waitlist`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
ALTER TABLE `badges` MODIFY COLUMN `conditionType` enum('first_participation','goal_reached','milestone_25','milestone_50','milestone_75','contribution_5','contribution_10','contribution_20','host_challenge','special') NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `participations` DROP COLUMN `followersCount`;--> statement-breakpoint
ALTER TABLE `participations` DROP COLUMN `gender`;--> statement-breakpoint
ALTER TABLE `participations` DROP COLUMN `attendanceType`;--> statement-breakpoint
ALTER TABLE `participations` DROP COLUMN `deletedAt`;--> statement-breakpoint
ALTER TABLE `participations` DROP COLUMN `deletedBy`;--> statement-breakpoint
ALTER TABLE `invitation_uses` DROP COLUMN `twitterId`;--> statement-breakpoint
ALTER TABLE `invitation_uses` DROP COLUMN `twitterUsername`;--> statement-breakpoint
ALTER TABLE `invitation_uses` DROP COLUMN `isConfirmed`;--> statement-breakpoint
ALTER TABLE `invitation_uses` DROP COLUMN `confirmedAt`;--> statement-breakpoint
ALTER TABLE `invitations` DROP COLUMN `customMessage`;--> statement-breakpoint
ALTER TABLE `invitations` DROP COLUMN `customTitle`;