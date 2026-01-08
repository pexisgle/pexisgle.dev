ALTER TABLE `user` RENAME COLUMN "display_user_name" TO "display_name";--> statement-breakpoint
ALTER TABLE `user` ADD `avatar_url` text;