CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`day_type` text NOT NULL,
	`hour` integer NOT NULL,
	`price` integer NOT NULL,
	`strike_price` integer NOT NULL,
	`is_peak` integer NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "pricing_rules_hour_check" CHECK("pricing_rules"."hour" >= 0 AND "pricing_rules"."hour" <= 23),
	CONSTRAINT "pricing_rules_price_check" CHECK("pricing_rules"."price" > 0 AND "pricing_rules"."strike_price" >= "pricing_rules"."price")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_rules_venue_day_hour_unique` ON `pricing_rules` (`venue_id`,`day_type`,`hour`);