CREATE TABLE `slot_holds` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`venue_id` text NOT NULL,
	`court_id` text NOT NULL,
	`date` text NOT NULL,
	`start_hour` integer NOT NULL,
	`duration_hours` integer DEFAULT 1 NOT NULL,
	`channel` text DEFAULT 'ayo' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`released_at` integer,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "slot_holds_start_hour_check" CHECK("slot_holds"."start_hour" >= 0 AND "slot_holds"."start_hour" <= 23),
	CONSTRAINT "slot_holds_duration_check" CHECK("slot_holds"."duration_hours" >= 1 AND "slot_holds"."duration_hours" <= 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slot_holds_reference_unique` ON `slot_holds` (`reference`);--> statement-breakpoint
CREATE INDEX `slot_holds_court_date_idx` ON `slot_holds` (`court_id`,`date`,`start_hour`);--> statement-breakpoint
CREATE INDEX `slot_holds_expires_idx` ON `slot_holds` (`expires_at`);