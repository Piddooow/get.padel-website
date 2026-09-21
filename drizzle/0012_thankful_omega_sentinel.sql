CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`slug` text NOT NULL,
	`title_id` text NOT NULL,
	`title_en` text NOT NULL,
	`excerpt_id` text NOT NULL,
	`excerpt_en` text NOT NULL,
	`body_id` text NOT NULL,
	`body_en` text NOT NULL,
	`tag_id` text NOT NULL,
	`tag_en` text NOT NULL,
	`cover_url` text,
	`read_minutes` integer DEFAULT 2 NOT NULL,
	`published_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "blog_posts_read_minutes_check" CHECK("blog_posts"."read_minutes" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_venue_slug_unique` ON `blog_posts` (`venue_id`,`slug`);--> statement-breakpoint
CREATE INDEX `blog_posts_venue_published_idx` ON `blog_posts` (`venue_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `gallery_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`src` text NOT NULL,
	`alt_id` text NOT NULL,
	`alt_en` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gallery_photos_venue_idx` ON `gallery_photos` (`venue_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`email` text NOT NULL,
	`locale` text,
	`status` text DEFAULT 'subscribed' NOT NULL,
	`source` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_venue_email_unique` ON `newsletter_subscribers` (`venue_id`,`email`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`author` text NOT NULL,
	`source` text NOT NULL,
	`rating` integer NOT NULL,
	`period_id` text NOT NULL,
	`period_en` text NOT NULL,
	`quote_id` text NOT NULL,
	`quote_en` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "testimonials_rating_check" CHECK("testimonials"."rating" >= 1 AND "testimonials"."rating" <= 5)
);
--> statement-breakpoint
CREATE INDEX `testimonials_venue_idx` ON `testimonials` (`venue_id`,`sort_order`);