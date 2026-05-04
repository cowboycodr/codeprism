CREATE TABLE `job_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`stream` text NOT NULL,
	`line` text NOT NULL,
	`sequence` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`push_id` integer,
	`commit_sha` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`command` text NOT NULL,
	`exit_code` integer,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`push_id`) REFERENCES `pushes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `pushes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repository_id` integer NOT NULL,
	`old_sha` text NOT NULL,
	`new_sha` text NOT NULL,
	`ref_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`default_branch` text DEFAULT 'main' NOT NULL,
	`ci_command` text DEFAULT 'npm test' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_owner_name_unique` ON `repositories` (`owner`,`name`);--> statement-breakpoint
CREATE TABLE `ssh_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`public_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ssh_keys_public_key_unique` ON `ssh_keys` (`public_key`);