CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_en` text NOT NULL,
	`answer_id` text NOT NULL,
	`answer_en` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `faqs_venue_idx` ON `faqs` (`venue_id`,`sort_order`);