CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`court_id` text NOT NULL,
	`date` text NOT NULL,
	`start_hour` integer NOT NULL,
	`duration_hours` integer DEFAULT 1 NOT NULL,
	`amount_idr` integer NOT NULL,
	`status` text DEFAULT 'pending_payment' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`provider` text DEFAULT 'midtrans' NOT NULL,
	`provider_order_id` text NOT NULL,
	`snap_token` text,
	`snap_redirect_url` text,
	`expires_at` integer NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_reference_unique` ON `bookings` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_provider_order_unique` ON `bookings` (`provider_order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_slot_unique` ON `bookings` (`court_id`,`date`,`start_hour`) WHERE "bookings"."status" in ('pending_payment','paid');--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`provider` text DEFAULT 'midtrans' NOT NULL,
	`provider_order_id` text NOT NULL,
	`transaction_id` text,
	`transaction_status` text NOT NULL,
	`fraud_status` text,
	`gross_amount` integer,
	`payload` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payments_booking_idx` ON `payments` (`booking_id`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`provider_order_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`whatsapp` text,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `open_matches` ADD `starts_at` integer;