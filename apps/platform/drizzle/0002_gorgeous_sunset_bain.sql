PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "user_id", "account_id", "provider_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "user_id", "account_id", "provider_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_identity_unique` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "updated_at") SELECT "id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "updated_at" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`platform_role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "user_platform_role_check" CHECK("__new_user"."platform_role" IN ('user', 'staff', 'admin')),
	CONSTRAINT "user_status_check" CHECK("__new_user"."status" IN ('active', 'suspended', 'archived')),
	CONSTRAINT "user_email_verified_check" CHECK("__new_user"."email_verified" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "display_name", "email", "email_verified", "image", "platform_role", "status", "created_at", "updated_at") SELECT "id", "display_name", "email", "email_verified", "image", "platform_role", "status", "created_at", "updated_at" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `__new_learners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`contact_email` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learners_status_check" CHECK("__new_learners"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_learners`("id", "user_id", "first_name", "last_name", "contact_email", "status", "created_at", "updated_at") SELECT "id", "user_id", "first_name", "last_name", "contact_email", "status", "created_at", "updated_at" FROM `learners`;--> statement-breakpoint
DROP TABLE `learners`;--> statement-breakpoint
ALTER TABLE `__new_learners` RENAME TO `learners`;--> statement-breakpoint
CREATE UNIQUE INDEX `learners_user_id_unique` ON `learners` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_organization_learners` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`employee_reference` text,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`left_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "organization_learners_status_check" CHECK("__new_organization_learners"."status" IN ('active', 'inactive')),
	CONSTRAINT "organization_learners_dates_check" CHECK("__new_organization_learners"."left_at" IS NULL OR "__new_organization_learners"."left_at" >= "__new_organization_learners"."joined_at")
);
--> statement-breakpoint
INSERT INTO `__new_organization_learners`("id", "organization_id", "learner_id", "employee_reference", "status", "joined_at", "left_at", "created_at", "updated_at") SELECT "id", "organization_id", "learner_id", "employee_reference", "status", "joined_at", "left_at", "created_at", "updated_at" FROM `organization_learners`;--> statement-breakpoint
DROP TABLE `organization_learners`;--> statement-breakpoint
ALTER TABLE `__new_organization_learners` RENAME TO `organization_learners`;--> statement-breakpoint
CREATE UNIQUE INDEX `organization_learners_pair_unique` ON `organization_learners` (`organization_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `organization_learners_learner_idx` ON `organization_learners` (`learner_id`);--> statement-breakpoint
CREATE TABLE `__new_organization_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "organization_memberships_role_check" CHECK("__new_organization_memberships"."role" IN ('owner', 'manager', 'billing', 'viewer')),
	CONSTRAINT "organization_memberships_status_check" CHECK("__new_organization_memberships"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
INSERT INTO `__new_organization_memberships`("id", "organization_id", "user_id", "role", "status", "created_at", "updated_at") SELECT "id", "organization_id", "user_id", "role", "status", "created_at", "updated_at" FROM `organization_memberships`;--> statement-breakpoint
DROP TABLE `organization_memberships`;--> statement-breakpoint
ALTER TABLE `__new_organization_memberships` RENAME TO `organization_memberships`;--> statement-breakpoint
CREATE UNIQUE INDEX `organization_memberships_pair_unique` ON `organization_memberships` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `organization_memberships_user_idx` ON `organization_memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_email` text,
	`contact_phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "organizations_status_check" CHECK("__new_organizations"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_organizations`("id", "name", "contact_email", "contact_phone", "status", "created_at", "updated_at") SELECT "id", "name", "contact_email", "contact_phone", "status", "created_at", "updated_at" FROM `organizations`;--> statement-breakpoint
DROP TABLE `organizations`;--> statement-breakpoint
ALTER TABLE `__new_organizations` RENAME TO `organizations`;--> statement-breakpoint
CREATE TABLE `__new_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`certificate_number` text NOT NULL,
	`learner_id` text NOT NULL,
	`enrollment_id` text NOT NULL,
	`recipient_name_snapshot` text NOT NULL,
	`credential_title_snapshot` text NOT NULL,
	`issued_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	`revocation_reason` text,
	`verification_code` text NOT NULL,
	`document_reference` text,
	`supersedes_certificate_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`supersedes_certificate_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`enrollment_id`,`learner_id`) REFERENCES `enrollments`(`id`,`learner_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "certificates_expiry_check" CHECK("__new_certificates"."expires_at" IS NULL OR "__new_certificates"."expires_at" >= "__new_certificates"."issued_at"),
	CONSTRAINT "certificates_revocation_date_check" CHECK("__new_certificates"."revoked_at" IS NULL OR "__new_certificates"."revoked_at" >= "__new_certificates"."issued_at"),
	CONSTRAINT "certificates_supersedes_check" CHECK("__new_certificates"."supersedes_certificate_id" IS NULL OR "__new_certificates"."supersedes_certificate_id" != "__new_certificates"."id")
);
--> statement-breakpoint
INSERT INTO `__new_certificates`("id", "certificate_number", "learner_id", "enrollment_id", "recipient_name_snapshot", "credential_title_snapshot", "issued_at", "expires_at", "revoked_at", "revocation_reason", "verification_code", "document_reference", "supersedes_certificate_id", "created_at", "updated_at") SELECT "id", "certificate_number", "learner_id", "enrollment_id", "recipient_name_snapshot", "credential_title_snapshot", "issued_at", "expires_at", "revoked_at", "revocation_reason", "verification_code", "document_reference", "supersedes_certificate_id", "created_at", "updated_at" FROM `certificates`;--> statement-breakpoint
DROP TABLE `certificates`;--> statement-breakpoint
ALTER TABLE `__new_certificates` RENAME TO `certificates`;--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_certificate_number_unique` ON `certificates` (`certificate_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_verification_code_unique` ON `certificates` (`verification_code`);--> statement-breakpoint
CREATE INDEX `certificates_learner_idx` ON `certificates` (`learner_id`);--> statement-breakpoint
CREATE INDEX `certificates_enrollment_idx` ON `certificates` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "courses_status_check" CHECK("__new_courses"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "code", "title", "description", "status", "created_at", "updated_at") SELECT "id", "code", "title", "description", "status", "created_at", "updated_at" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
CREATE UNIQUE INDEX `courses_code_unique` ON `courses` (`code`);--> statement-breakpoint
CREATE TABLE `__new_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`course_id` text NOT NULL,
	`order_item_id` text,
	`organization_id` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`enrolled_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "enrollments_status_check" CHECK("__new_enrollments"."status" IN ('not_started', 'in_progress', 'completed', 'failed', 'withdrawn', 'expired', 'revoked')),
	CONSTRAINT "enrollments_start_date_check" CHECK("__new_enrollments"."started_at" IS NULL OR "__new_enrollments"."started_at" >= "__new_enrollments"."enrolled_at"),
	CONSTRAINT "enrollments_completion_date_check" CHECK("__new_enrollments"."completed_at" IS NULL OR "__new_enrollments"."completed_at" >= coalesce("__new_enrollments"."started_at", "__new_enrollments"."enrolled_at")),
	CONSTRAINT "enrollments_completed_timestamp_check" CHECK("__new_enrollments"."status" != 'completed' OR "__new_enrollments"."completed_at" IS NOT NULL)
);
--> statement-breakpoint
INSERT INTO `__new_enrollments`("id", "learner_id", "course_id", "order_item_id", "organization_id", "status", "enrolled_at", "started_at", "completed_at", "created_at", "updated_at") SELECT "id", "learner_id", "course_id", "order_item_id", "organization_id", "status", "enrolled_at", "started_at", "completed_at", "created_at", "updated_at" FROM `enrollments`;--> statement-breakpoint
DROP TABLE `enrollments`;--> statement-breakpoint
ALTER TABLE `__new_enrollments` RENAME TO `enrollments`;--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_id_learner_unique` ON `enrollments` (`id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `enrollments_learner_idx` ON `enrollments` (`learner_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_order_item_idx` ON `enrollments` (`order_item_id`);--> statement-breakpoint
CREATE INDEX `enrollments_organization_idx` ON `enrollments` (`organization_id`);--> statement-breakpoint
CREATE TABLE `__new_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_price_id` text,
	`sku_snapshot` text NOT NULL,
	`product_name_snapshot` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_amount` integer NOT NULL,
	`subtotal_amount` integer NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_price_id`,`product_id`) REFERENCES `product_prices`(`id`,`product_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "order_items_quantity_check" CHECK("__new_order_items"."quantity" IS NULL OR (typeof("__new_order_items"."quantity") = 'integer' AND "__new_order_items"."quantity" >= 1 AND "__new_order_items"."quantity" <= 9007199254740991)),
	CONSTRAINT "order_items_unit_amount_check" CHECK("__new_order_items"."unit_amount" IS NULL OR (typeof("__new_order_items"."unit_amount") = 'integer' AND "__new_order_items"."unit_amount" >= 0 AND "__new_order_items"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_check" CHECK("__new_order_items"."subtotal_amount" IS NULL OR (typeof("__new_order_items"."subtotal_amount") = 'integer' AND "__new_order_items"."subtotal_amount" >= 0 AND "__new_order_items"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_discount_check" CHECK("__new_order_items"."discount_amount" IS NULL OR (typeof("__new_order_items"."discount_amount") = 'integer' AND "__new_order_items"."discount_amount" >= 0 AND "__new_order_items"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_tax_check" CHECK("__new_order_items"."tax_amount" IS NULL OR (typeof("__new_order_items"."tax_amount") = 'integer' AND "__new_order_items"."tax_amount" >= 0 AND "__new_order_items"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_total_check" CHECK("__new_order_items"."total_amount" IS NULL OR (typeof("__new_order_items"."total_amount") = 'integer' AND "__new_order_items"."total_amount" >= 0 AND "__new_order_items"."total_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_arithmetic_check" CHECK("__new_order_items"."subtotal_amount" = "__new_order_items"."unit_amount" * "__new_order_items"."quantity"),
	CONSTRAINT "order_items_discount_limit_check" CHECK("__new_order_items"."discount_amount" <= "__new_order_items"."subtotal_amount"),
	CONSTRAINT "order_items_total_arithmetic_check" CHECK("__new_order_items"."total_amount" = "__new_order_items"."subtotal_amount" - "__new_order_items"."discount_amount" + "__new_order_items"."tax_amount")
);
--> statement-breakpoint
INSERT INTO `__new_order_items`("id", "order_id", "product_id", "product_price_id", "sku_snapshot", "product_name_snapshot", "quantity", "unit_amount", "subtotal_amount", "discount_amount", "tax_amount", "total_amount", "created_at", "updated_at") SELECT "id", "order_id", "product_id", "product_price_id", "sku_snapshot", "product_name_snapshot", "quantity", "unit_amount", "subtotal_amount", "discount_amount", "tax_amount", "total_amount", "created_at", "updated_at" FROM `order_items`;--> statement-breakpoint
DROP TABLE `order_items`;--> statement-breakpoint
ALTER TABLE `__new_order_items` RENAME TO `order_items`;--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`placed_by_user_id` text NOT NULL,
	`purchasing_organization_id` text,
	`purchaser_name_snapshot` text NOT NULL,
	`purchaser_email_snapshot` text NOT NULL,
	`billing_details_snapshot` text NOT NULL,
	`currency` text NOT NULL,
	`subtotal_amount` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`tax_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`placed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`placed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`purchasing_organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "orders_status_check" CHECK("__new_orders"."status" IN ('draft', 'pending', 'confirmed', 'completed', 'canceled')),
	CONSTRAINT "orders_currency_check" CHECK("__new_orders"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "orders_subtotal_check" CHECK("__new_orders"."subtotal_amount" IS NULL OR (typeof("__new_orders"."subtotal_amount") = 'integer' AND "__new_orders"."subtotal_amount" >= 0 AND "__new_orders"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_check" CHECK("__new_orders"."discount_amount" IS NULL OR (typeof("__new_orders"."discount_amount") = 'integer' AND "__new_orders"."discount_amount" >= 0 AND "__new_orders"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "orders_tax_check" CHECK("__new_orders"."tax_amount" IS NULL OR (typeof("__new_orders"."tax_amount") = 'integer' AND "__new_orders"."tax_amount" >= 0 AND "__new_orders"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "orders_total_check" CHECK("__new_orders"."total_amount" IS NULL OR (typeof("__new_orders"."total_amount") = 'integer' AND "__new_orders"."total_amount" >= 0 AND "__new_orders"."total_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_limit_check" CHECK("__new_orders"."discount_amount" <= "__new_orders"."subtotal_amount"),
	CONSTRAINT "orders_total_arithmetic_check" CHECK("__new_orders"."total_amount" = "__new_orders"."subtotal_amount" - "__new_orders"."discount_amount" + "__new_orders"."tax_amount"),
	CONSTRAINT "orders_billing_json_check" CHECK(json_valid("__new_orders"."billing_details_snapshot"))
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "order_number", "placed_by_user_id", "purchasing_organization_id", "purchaser_name_snapshot", "purchaser_email_snapshot", "billing_details_snapshot", "currency", "subtotal_amount", "discount_amount", "tax_amount", "total_amount", "status", "placed_at", "created_at", "updated_at") SELECT "id", "order_number", "placed_by_user_id", "purchasing_organization_id", "purchaser_name_snapshot", "purchaser_email_snapshot", "billing_details_snapshot", "currency", "subtotal_amount", "discount_amount", "tax_amount", "total_amount", "status", "placed_at", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`placed_by_user_id`);--> statement-breakpoint
CREATE INDEX `orders_organization_idx` ON `orders` (`purchasing_organization_id`);--> statement-breakpoint
CREATE TABLE `__new_product_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`currency` text NOT NULL,
	`unit_amount` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`valid_from` integer,
	`valid_until` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "product_prices_currency_check" CHECK("__new_product_prices"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "product_prices_amount_check" CHECK("__new_product_prices"."unit_amount" IS NULL OR (typeof("__new_product_prices"."unit_amount") = 'integer' AND "__new_product_prices"."unit_amount" >= 0 AND "__new_product_prices"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "product_prices_active_check" CHECK("__new_product_prices"."active" IN (0, 1)),
	CONSTRAINT "product_prices_dates_check" CHECK("__new_product_prices"."valid_until" IS NULL OR "__new_product_prices"."valid_from" IS NULL OR "__new_product_prices"."valid_until" > "__new_product_prices"."valid_from")
);
--> statement-breakpoint
INSERT INTO `__new_product_prices`("id", "product_id", "currency", "unit_amount", "active", "valid_from", "valid_until", "created_at", "updated_at") SELECT "id", "product_id", "currency", "unit_amount", "active", "valid_from", "valid_until", "created_at", "updated_at" FROM `product_prices`;--> statement-breakpoint
DROP TABLE `product_prices`;--> statement-breakpoint
ALTER TABLE `__new_product_prices` RENAME TO `product_prices`;--> statement-breakpoint
CREATE UNIQUE INDEX `product_prices_id_product_unique` ON `product_prices` (`id`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_prices_product_idx` ON `product_prices` (`product_id`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`product_type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "products_type_check" CHECK("__new_products"."product_type" IN ('course_access', 'course_package')),
	CONSTRAINT "products_status_check" CHECK("__new_products"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "sku", "name", "description", "product_type", "status", "created_at", "updated_at") SELECT "id", "sku", "name", "description", "product_type", "status", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `__new_payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_account_reference` text NOT NULL,
	`environment` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`order_id` text,
	`payment_id` text,
	`payload_json` text NOT NULL,
	`processing_status` text DEFAULT 'received' NOT NULL,
	`received_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`processed_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payment_events_environment_check" CHECK("__new_payment_events"."environment" IN ('test', 'live')),
	CONSTRAINT "payment_events_status_check" CHECK("__new_payment_events"."processing_status" IN ('received', 'processing', 'processed', 'failed')),
	CONSTRAINT "payment_events_attempt_count_check" CHECK("__new_payment_events"."attempt_count" IS NULL OR (typeof("__new_payment_events"."attempt_count") = 'integer' AND "__new_payment_events"."attempt_count" >= 0 AND "__new_payment_events"."attempt_count" <= 9007199254740991)),
	CONSTRAINT "payment_events_payload_json_check" CHECK(json_valid("__new_payment_events"."payload_json"))
);
--> statement-breakpoint
INSERT INTO `__new_payment_events`("id", "provider", "provider_account_reference", "environment", "provider_event_id", "event_type", "order_id", "payment_id", "payload_json", "processing_status", "received_at", "processed_at", "attempt_count", "last_error", "created_at", "updated_at") SELECT "id", "provider", "provider_account_reference", "environment", "provider_event_id", "event_type", "order_id", "payment_id", "payload_json", "processing_status", "received_at", "processed_at", "attempt_count", "last_error", "created_at", "updated_at" FROM `payment_events`;--> statement-breakpoint
DROP TABLE `payment_events`;--> statement-breakpoint
ALTER TABLE `__new_payment_events` RENAME TO `payment_events`;--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_provider_event_unique` ON `payment_events` (`provider`,`provider_account_reference`,`environment`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_events_payment_idx` ON `payment_events` (`payment_id`);--> statement-breakpoint
CREATE INDEX `payment_events_order_idx` ON `payment_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_events_processing_idx` ON `payment_events` (`processing_status`,`received_at`);--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_reference` text NOT NULL,
	`provider_checkout_id` text,
	`provider_payment_id` text,
	`idempotency_key` text NOT NULL,
	`currency` text NOT NULL,
	`requested_amount` integer NOT NULL,
	`captured_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_status` text,
	`succeeded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payments_status_check" CHECK("__new_payments"."status" IN ('pending', 'requires_action', 'processing', 'authorized', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "payments_currency_check" CHECK("__new_payments"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "payments_requested_amount_check" CHECK("__new_payments"."requested_amount" IS NULL OR (typeof("__new_payments"."requested_amount") = 'integer' AND "__new_payments"."requested_amount" >= 0 AND "__new_payments"."requested_amount" <= 9007199254740991)),
	CONSTRAINT "payments_captured_amount_check" CHECK("__new_payments"."captured_amount" IS NULL OR (typeof("__new_payments"."captured_amount") = 'integer' AND "__new_payments"."captured_amount" >= 0 AND "__new_payments"."captured_amount" <= 9007199254740991)),
	CONSTRAINT "payments_capture_limit_check" CHECK("__new_payments"."captured_amount" <= "__new_payments"."requested_amount")
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "order_id", "provider", "provider_account_reference", "provider_checkout_id", "provider_payment_id", "idempotency_key", "currency", "requested_amount", "captured_amount", "status", "provider_status", "succeeded_at", "created_at", "updated_at") SELECT "id", "order_id", "provider", "provider_account_reference", "provider_checkout_id", "provider_payment_id", "idempotency_key", "currency", "requested_amount", "captured_amount", "status", "provider_status", "succeeded_at", "created_at", "updated_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_payment_unique` ON `payments` (`provider`,`provider_account_reference`,`provider_payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_checkout_unique` ON `payments` (`provider`,`provider_account_reference`,`provider_checkout_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_unique` ON `payments` (`provider`,`provider_account_reference`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `__new_refund_items` (
	`id` text PRIMARY KEY NOT NULL,
	`refund_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`amount` integer NOT NULL,
	`quantity` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "refund_items_amount_check" CHECK("__new_refund_items"."amount" IS NULL OR (typeof("__new_refund_items"."amount") = 'integer' AND "__new_refund_items"."amount" >= 1 AND "__new_refund_items"."amount" <= 9007199254740991)),
	CONSTRAINT "refund_items_quantity_check" CHECK("__new_refund_items"."quantity" IS NULL OR (typeof("__new_refund_items"."quantity") = 'integer' AND "__new_refund_items"."quantity" >= 1 AND "__new_refund_items"."quantity" <= 9007199254740991))
);
--> statement-breakpoint
INSERT INTO `__new_refund_items`("id", "refund_id", "order_item_id", "amount", "quantity", "created_at", "updated_at") SELECT "id", "refund_id", "order_item_id", "amount", "quantity", "created_at", "updated_at" FROM `refund_items`;--> statement-breakpoint
DROP TABLE `refund_items`;--> statement-breakpoint
ALTER TABLE `__new_refund_items` RENAME TO `refund_items`;--> statement-breakpoint
CREATE UNIQUE INDEX `refund_items_refund_item_unique` ON `refund_items` (`refund_id`,`order_item_id`);--> statement-breakpoint
CREATE INDEX `refund_items_order_item_idx` ON `refund_items` (`order_item_id`);--> statement-breakpoint
CREATE TABLE `__new_refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`provider_refund_id` text,
	`idempotency_key` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by_user_id` text,
	`requested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`requested_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "refunds_status_check" CHECK("__new_refunds"."status" IN ('pending', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "refunds_currency_check" CHECK("__new_refunds"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "refunds_amount_check" CHECK("__new_refunds"."amount" IS NULL OR (typeof("__new_refunds"."amount") = 'integer' AND "__new_refunds"."amount" >= 1 AND "__new_refunds"."amount" <= 9007199254740991)),
	CONSTRAINT "refunds_completed_date_check" CHECK("__new_refunds"."completed_at" IS NULL OR "__new_refunds"."completed_at" >= "__new_refunds"."requested_at")
);
--> statement-breakpoint
INSERT INTO `__new_refunds`("id", "payment_id", "provider_refund_id", "idempotency_key", "amount", "currency", "reason", "status", "requested_by_user_id", "requested_at", "completed_at", "created_at", "updated_at") SELECT "id", "payment_id", "provider_refund_id", "idempotency_key", "amount", "currency", "reason", "status", "requested_by_user_id", "requested_at", "completed_at", "created_at", "updated_at" FROM `refunds`;--> statement-breakpoint
DROP TABLE `refunds`;--> statement-breakpoint
ALTER TABLE `__new_refunds` RENAME TO `refunds`;--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_payment_provider_refund_unique` ON `refunds` (`payment_id`,`provider_refund_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_payment_idempotency_unique` ON `refunds` (`payment_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `refunds_payment_idx` ON `refunds` (`payment_id`);