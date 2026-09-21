CREATE TABLE `open_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`day_label_id` text NOT NULL,
	`day_label_en` text NOT NULL,
	`time_label` text NOT NULL,
	`level_id` text NOT NULL,
	`level_en` text NOT NULL,
	`court_note_id` text NOT NULL,
	`court_note_en` text NOT NULL,
	`spots_total` integer NOT NULL,
	`spots_left` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "open_matches_spots_total_check" CHECK("open_matches"."spots_total" > 0),
	CONSTRAINT "open_matches_spots_left_check" CHECK("open_matches"."spots_left" >= 0 AND "open_matches"."spots_left" <= "open_matches"."spots_total")
);
--> statement-breakpoint
CREATE INDEX `open_matches_venue_idx` ON `open_matches` (`venue_id`,`sort_order`);