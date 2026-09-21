CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`page_path` text,
	`link_url` text,
	`link_text` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`name`,`created_at`);