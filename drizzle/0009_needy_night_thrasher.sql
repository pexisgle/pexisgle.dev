CREATE TABLE `award` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text,
	`status` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `award_order_idx` ON `award` (`order`);--> statement-breakpoint
CREATE TABLE `certification` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text,
	`status` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `certification_order_idx` ON `certification` (`order`);