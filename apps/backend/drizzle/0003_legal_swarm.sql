CREATE TABLE `lab_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`facility` text NOT NULL,
	`procedures` text,
	`doctors_note` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lab_results` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`order_id` text,
	`report_type` text NOT NULL,
	`source_lab` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `lab_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `is_read` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachments` text;--> statement-breakpoint
ALTER TABLE `users` ADD `age` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` text;--> statement-breakpoint
ALTER TABLE `users` ADD `department` text;--> statement-breakpoint
ALTER TABLE `users` ADD `diagnosis` text;--> statement-breakpoint
ALTER TABLE `users` ADD `inpatient_status` text;--> statement-breakpoint
ALTER TABLE `users` ADD `insurance_type` text;