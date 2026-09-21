CREATE TABLE `courts` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`name` text NOT NULL,
	`indoor` integer DEFAULT true NOT NULL,
	`surface` text NOT NULL,
	`session_minutes` integer DEFAULT 60 NOT NULL,
	`description_en` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "courts_session_minutes_check" CHECK("courts"."session_minutes" > 0)
);
--> statement-breakpoint
CREATE INDEX `courts_venue_idx` ON `courts` (`venue_id`);--> statement-breakpoint
CREATE TABLE `schedule_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`court_id` text NOT NULL,
	`date` text NOT NULL,
	`hour` integer NOT NULL,
	`status` text NOT NULL,
	`source` text DEFAULT 'mock' NOT NULL,
	`checked_at` integer,
	FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "schedule_slots_hour_check" CHECK("schedule_slots"."hour" >= 0 AND "schedule_slots"."hour" <= 23)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_slots_court_date_hour_unique` ON `schedule_slots` (`court_id`,`date`,`hour`);--> statement-breakpoint
CREATE INDEX `schedule_slots_date_idx` ON `schedule_slots` (`date`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`address_street` text NOT NULL,
	`address_district` text NOT NULL,
	`address_city` text NOT NULL,
	`plus_code` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`court_open_hour` integer NOT NULL,
	`court_close_hour` integer NOT NULL,
	`cafe_open_hour` integer NOT NULL,
	`cafe_close_hour` integer NOT NULL,
	`session_minutes` integer DEFAULT 60 NOT NULL,
	`rating_google` real,
	`rating_google_count` integer,
	`rating_ayo` real,
	`rating_ayo_count` integer,
	`whatsapp` text NOT NULL,
	`email_event` text,
	`email_commercial` text,
	`instagram_url` text,
	`tiktok_url` text,
	`cafe_instagram_url` text,
	`booking_url` text NOT NULL,
	`maps_url` text,
	`linktree_url` text,
	`updated_at` integer NOT NULL
);
