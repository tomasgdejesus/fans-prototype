CREATE TABLE `account` (
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
CREATE UNIQUE INDEX `account_provider_identity_unique` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
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
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`platform_role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "user_platform_role_check" CHECK("user"."platform_role" IN ('user', 'staff', 'admin')),
	CONSTRAINT "user_status_check" CHECK("user"."status" IN ('active', 'suspended', 'archived')),
	CONSTRAINT "user_email_verified_check" CHECK("user"."email_verified" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `learners` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`contact_email` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "learners_status_check" CHECK("learners"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learners_user_id_unique` ON `learners` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization_learners` (
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
	CONSTRAINT "organization_learners_status_check" CHECK("organization_learners"."status" IN ('active', 'inactive')),
	CONSTRAINT "organization_learners_dates_check" CHECK("organization_learners"."left_at" IS NULL OR "organization_learners"."left_at" >= "organization_learners"."joined_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_learners_pair_unique` ON `organization_learners` (`organization_id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `organization_learners_learner_idx` ON `organization_learners` (`learner_id`);--> statement-breakpoint
CREATE TABLE `organization_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "organization_memberships_role_check" CHECK("organization_memberships"."role" IN ('owner', 'manager', 'billing', 'viewer')),
	CONSTRAINT "organization_memberships_status_check" CHECK("organization_memberships"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_memberships_pair_unique` ON `organization_memberships` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `organization_memberships_user_idx` ON `organization_memberships` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_email` text,
	`contact_phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "organizations_status_check" CHECK("organizations"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE `certificates` (
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
	CONSTRAINT "certificates_expiry_check" CHECK("certificates"."expires_at" IS NULL OR "certificates"."expires_at" >= "certificates"."issued_at"),
	CONSTRAINT "certificates_revocation_date_check" CHECK("certificates"."revoked_at" IS NULL OR "certificates"."revoked_at" >= "certificates"."issued_at"),
	CONSTRAINT "certificates_supersedes_check" CHECK("certificates"."supersedes_certificate_id" IS NULL OR "certificates"."supersedes_certificate_id" != "certificates"."id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_certificate_number_unique` ON `certificates` (`certificate_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_verification_code_unique` ON `certificates` (`verification_code`);--> statement-breakpoint
CREATE INDEX `certificates_learner_idx` ON `certificates` (`learner_id`);--> statement-breakpoint
CREATE INDEX `certificates_enrollment_idx` ON `certificates` (`enrollment_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "courses_status_check" CHECK("courses"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_code_unique` ON `courses` (`code`);--> statement-breakpoint
CREATE TABLE `enrollments` (
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
	CONSTRAINT "enrollments_status_check" CHECK("enrollments"."status" IN ('not_started', 'in_progress', 'completed', 'failed', 'withdrawn', 'expired', 'revoked')),
	CONSTRAINT "enrollments_start_date_check" CHECK("enrollments"."started_at" IS NULL OR "enrollments"."started_at" >= "enrollments"."enrolled_at"),
	CONSTRAINT "enrollments_completion_date_check" CHECK("enrollments"."completed_at" IS NULL OR "enrollments"."completed_at" >= coalesce("enrollments"."started_at", "enrollments"."enrolled_at")),
	CONSTRAINT "enrollments_completed_timestamp_check" CHECK("enrollments"."status" != 'completed' OR "enrollments"."completed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_id_learner_unique` ON `enrollments` (`id`,`learner_id`);--> statement-breakpoint
CREATE INDEX `enrollments_learner_idx` ON `enrollments` (`learner_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_order_item_idx` ON `enrollments` (`order_item_id`);--> statement-breakpoint
CREATE INDEX `enrollments_organization_idx` ON `enrollments` (`organization_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
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
	CONSTRAINT "order_items_quantity_check" CHECK("order_items"."quantity" IS NULL OR (typeof("order_items"."quantity") = 'integer' AND "order_items"."quantity" >= 1 AND "order_items"."quantity" <= 9007199254740991)),
	CONSTRAINT "order_items_unit_amount_check" CHECK("order_items"."unit_amount" IS NULL OR (typeof("order_items"."unit_amount") = 'integer' AND "order_items"."unit_amount" >= 0 AND "order_items"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_check" CHECK("order_items"."subtotal_amount" IS NULL OR (typeof("order_items"."subtotal_amount") = 'integer' AND "order_items"."subtotal_amount" >= 0 AND "order_items"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_discount_check" CHECK("order_items"."discount_amount" IS NULL OR (typeof("order_items"."discount_amount") = 'integer' AND "order_items"."discount_amount" >= 0 AND "order_items"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_tax_check" CHECK("order_items"."tax_amount" IS NULL OR (typeof("order_items"."tax_amount") = 'integer' AND "order_items"."tax_amount" >= 0 AND "order_items"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_total_check" CHECK("order_items"."total_amount" IS NULL OR (typeof("order_items"."total_amount") = 'integer' AND "order_items"."total_amount" >= 0 AND "order_items"."total_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_arithmetic_check" CHECK("order_items"."subtotal_amount" = "order_items"."unit_amount" * "order_items"."quantity"),
	CONSTRAINT "order_items_discount_limit_check" CHECK("order_items"."discount_amount" <= "order_items"."subtotal_amount"),
	CONSTRAINT "order_items_total_arithmetic_check" CHECK("order_items"."total_amount" = "order_items"."subtotal_amount" - "order_items"."discount_amount" + "order_items"."tax_amount")
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `orders` (
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
	CONSTRAINT "orders_status_check" CHECK("orders"."status" IN ('draft', 'pending', 'confirmed', 'completed', 'canceled')),
	CONSTRAINT "orders_currency_check" CHECK("orders"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "orders_subtotal_check" CHECK("orders"."subtotal_amount" IS NULL OR (typeof("orders"."subtotal_amount") = 'integer' AND "orders"."subtotal_amount" >= 0 AND "orders"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_check" CHECK("orders"."discount_amount" IS NULL OR (typeof("orders"."discount_amount") = 'integer' AND "orders"."discount_amount" >= 0 AND "orders"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "orders_tax_check" CHECK("orders"."tax_amount" IS NULL OR (typeof("orders"."tax_amount") = 'integer' AND "orders"."tax_amount" >= 0 AND "orders"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "orders_total_check" CHECK("orders"."total_amount" IS NULL OR (typeof("orders"."total_amount") = 'integer' AND "orders"."total_amount" >= 0 AND "orders"."total_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_limit_check" CHECK("orders"."discount_amount" <= "orders"."subtotal_amount"),
	CONSTRAINT "orders_total_arithmetic_check" CHECK("orders"."total_amount" = "orders"."subtotal_amount" - "orders"."discount_amount" + "orders"."tax_amount"),
	CONSTRAINT "orders_billing_json_check" CHECK(json_valid("orders"."billing_details_snapshot"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`placed_by_user_id`);--> statement-breakpoint
CREATE INDEX `orders_organization_idx` ON `orders` (`purchasing_organization_id`);--> statement-breakpoint
CREATE TABLE `product_prices` (
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
	CONSTRAINT "product_prices_currency_check" CHECK("product_prices"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "product_prices_amount_check" CHECK("product_prices"."unit_amount" IS NULL OR (typeof("product_prices"."unit_amount") = 'integer' AND "product_prices"."unit_amount" >= 0 AND "product_prices"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "product_prices_active_check" CHECK("product_prices"."active" IN (0, 1)),
	CONSTRAINT "product_prices_dates_check" CHECK("product_prices"."valid_until" IS NULL OR "product_prices"."valid_from" IS NULL OR "product_prices"."valid_until" > "product_prices"."valid_from")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_prices_id_product_unique` ON `product_prices` (`id`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_prices_product_idx` ON `product_prices` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`product_type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "products_type_check" CHECK("products"."product_type" IN ('course_access', 'course_package')),
	CONSTRAINT "products_status_check" CHECK("products"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `payment_events` (
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
	CONSTRAINT "payment_events_environment_check" CHECK("payment_events"."environment" IN ('test', 'live')),
	CONSTRAINT "payment_events_status_check" CHECK("payment_events"."processing_status" IN ('received', 'processing', 'processed', 'failed')),
	CONSTRAINT "payment_events_attempt_count_check" CHECK("payment_events"."attempt_count" IS NULL OR (typeof("payment_events"."attempt_count") = 'integer' AND "payment_events"."attempt_count" >= 0 AND "payment_events"."attempt_count" <= 9007199254740991)),
	CONSTRAINT "payment_events_payload_json_check" CHECK(json_valid("payment_events"."payload_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_events_provider_event_unique` ON `payment_events` (`provider`,`provider_account_reference`,`environment`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `payment_events_payment_idx` ON `payment_events` (`payment_id`);--> statement-breakpoint
CREATE INDEX `payment_events_order_idx` ON `payment_events` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_events_processing_idx` ON `payment_events` (`processing_status`,`received_at`);--> statement-breakpoint
CREATE TABLE `payments` (
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
	CONSTRAINT "payments_status_check" CHECK("payments"."status" IN ('pending', 'requires_action', 'processing', 'authorized', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "payments_currency_check" CHECK("payments"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "payments_requested_amount_check" CHECK("payments"."requested_amount" IS NULL OR (typeof("payments"."requested_amount") = 'integer' AND "payments"."requested_amount" >= 0 AND "payments"."requested_amount" <= 9007199254740991)),
	CONSTRAINT "payments_captured_amount_check" CHECK("payments"."captured_amount" IS NULL OR (typeof("payments"."captured_amount") = 'integer' AND "payments"."captured_amount" >= 0 AND "payments"."captured_amount" <= 9007199254740991)),
	CONSTRAINT "payments_capture_limit_check" CHECK("payments"."captured_amount" <= "payments"."requested_amount")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_payment_unique` ON `payments` (`provider`,`provider_account_reference`,`provider_payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_checkout_unique` ON `payments` (`provider`,`provider_account_reference`,`provider_checkout_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_idempotency_unique` ON `payments` (`provider`,`provider_account_reference`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `refund_items` (
	`id` text PRIMARY KEY NOT NULL,
	`refund_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`amount` integer NOT NULL,
	`quantity` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "refund_items_amount_check" CHECK("refund_items"."amount" IS NULL OR (typeof("refund_items"."amount") = 'integer' AND "refund_items"."amount" >= 1 AND "refund_items"."amount" <= 9007199254740991)),
	CONSTRAINT "refund_items_quantity_check" CHECK("refund_items"."quantity" IS NULL OR (typeof("refund_items"."quantity") = 'integer' AND "refund_items"."quantity" >= 1 AND "refund_items"."quantity" <= 9007199254740991))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refund_items_refund_item_unique` ON `refund_items` (`refund_id`,`order_item_id`);--> statement-breakpoint
CREATE INDEX `refund_items_order_item_idx` ON `refund_items` (`order_item_id`);--> statement-breakpoint
CREATE TABLE `refunds` (
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
	CONSTRAINT "refunds_status_check" CHECK("refunds"."status" IN ('pending', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "refunds_currency_check" CHECK("refunds"."currency" GLOB '[A-Z][A-Z][A-Z]'),
	CONSTRAINT "refunds_amount_check" CHECK("refunds"."amount" IS NULL OR (typeof("refunds"."amount") = 'integer' AND "refunds"."amount" >= 1 AND "refunds"."amount" <= 9007199254740991)),
	CONSTRAINT "refunds_completed_date_check" CHECK("refunds"."completed_at" IS NULL OR "refunds"."completed_at" >= "refunds"."requested_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_payment_provider_refund_unique` ON `refunds` (`payment_id`,`provider_refund_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_payment_idempotency_unique` ON `refunds` (`payment_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `refunds_payment_idx` ON `refunds` (`payment_id`);