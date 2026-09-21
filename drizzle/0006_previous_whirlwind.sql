CREATE TABLE `facilities` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`detail_id` text,
	`detail_en` text,
	`icon` text NOT NULL,
	`official` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `facilities_venue_idx` ON `facilities` (`venue_id`,`sort_order`);--> statement-breakpoint
ALTER TABLE `venues` ADD `rating_cleanliness` real;--> statement-breakpoint
ALTER TABLE `venues` ADD `rating_court_condition` real;--> statement-breakpoint
ALTER TABLE `venues` ADD `rating_communication` real;