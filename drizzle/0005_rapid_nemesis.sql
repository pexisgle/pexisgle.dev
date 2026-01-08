CREATE INDEX `blog_published_idx` ON `blog` (`published`);--> statement-breakpoint
CREATE INDEX `blog_created_at_idx` ON `blog` (`created_at`);--> statement-breakpoint
CREATE INDEX `work_type_idx` ON `work` (`type`);--> statement-breakpoint
CREATE INDEX `work_created_at_idx` ON `work` (`created_at`);