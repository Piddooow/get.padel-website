CREATE TABLE `promos` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`code` text,
	`period_id` text NOT NULL,
	`period_en` text NOT NULL,
	`detail_id` text NOT NULL,
	`detail_en` text NOT NULL,
	`source` text,
	`link_url` text,
	`reference` text,
	`poster_url` text,
	`starts_on` text,
	`ends_on` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "promos_period_check" CHECK("promos"."starts_on" IS NULL OR "promos"."ends_on" IS NULL OR "promos"."starts_on" <= "promos"."ends_on")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promos_venue_code_unique` ON `promos` (`venue_id`,`code`);--> statement-breakpoint
CREATE INDEX `promos_active_order_idx` ON `promos` (`is_active`,`sort_order`);