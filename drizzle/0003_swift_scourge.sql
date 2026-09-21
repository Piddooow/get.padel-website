CREATE TABLE `guest_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`hold_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`court_id` text NOT NULL,
	`date` text NOT NULL,
	`start_hour` integer NOT NULL,
	`duration_hours` integer DEFAULT 1 NOT NULL,
	`channel` text DEFAULT 'ayo' NOT NULL,
	`payment_method` text,
	`guest_name` text,
	`guest_whatsapp` text,
	`guest_email` text,
	`status` text DEFAULT 'created' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`hold_id`) REFERENCES `slot_holds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "guest_orders_start_hour_check" CHECK("guest_orders"."start_hour" >= 0 AND "guest_orders"."start_hour" <= 23),
	CONSTRAINT "guest_orders_duration_check" CHECK("guest_orders"."duration_hours" >= 1 AND "guest_orders"."duration_hours" <= 3)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_orders_reference_unique` ON `guest_orders` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `guest_orders_hold_unique` ON `guest_orders` (`hold_id`);--> statement-breakpoint
CREATE INDEX `guest_orders_court_date_idx` ON `guest_orders` (`court_id`,`date`);