CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`kind` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`description_id` text NOT NULL,
	`description_en` text NOT NULL,
	`period_id` text NOT NULL,
	`period_en` text NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "events_kind_check" CHECK("events"."kind" IN ('tournament', 'social', 'class', 'community')),
	CONSTRAINT "events_period_check" CHECK("events"."ends_at" IS NULL OR "events"."starts_at" IS NULL OR "events"."starts_at" <= "events"."ends_at")
);
--> statement-breakpoint
CREATE INDEX `events_venue_idx` ON `events` (`venue_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `events_starts_idx` ON `events` (`starts_at`);