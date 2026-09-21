CREATE TABLE `coaching_program_tiers` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`label_id` text NOT NULL,
	`label_en` text NOT NULL,
	`price_idr` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `coaching_programs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "coaching_program_tiers_price_check" CHECK("coaching_program_tiers"."price_idr" IS NULL OR "coaching_program_tiers"."price_idr" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coaching_program_tiers_program_order_unique` ON `coaching_program_tiers` (`program_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `coaching_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`kind` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`description_id` text NOT NULL,
	`description_en` text NOT NULL,
	`highlights` text,
	`price_note_id` text,
	`price_note_en` text,
	`cta_kind` text DEFAULT 'whatsapp' NOT NULL,
	`registration_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "coaching_programs_kind_check" CHECK("coaching_programs"."kind" IN ('private', 'multi_session', 'junior', 'free_trial'))
);
--> statement-breakpoint
CREATE INDEX `coaching_programs_venue_idx` ON `coaching_programs` (`venue_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `program_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`program_id` text NOT NULL,
	`venue_id` text NOT NULL,
	`name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text,
	`preferred_schedule` text,
	`notes` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `coaching_programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_registrations_reference_unique` ON `program_registrations` (`reference`);--> statement-breakpoint
CREATE INDEX `program_registrations_program_idx` ON `program_registrations` (`program_id`,`created_at`);