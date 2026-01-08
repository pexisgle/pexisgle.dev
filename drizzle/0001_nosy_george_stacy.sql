CREATE TABLE `work_urls` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `work`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `work` DROP COLUMN `url`;