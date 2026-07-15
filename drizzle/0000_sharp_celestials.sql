CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`operation_label` text NOT NULL,
	`operation_name` text,
	`category` text,
	`amount` integer NOT NULL,
	`account_balance` integer
);
