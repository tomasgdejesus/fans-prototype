CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp (3) with time zone,
	"refresh_token_expires_at" timestamp (3) with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"platform_role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_platform_role_check" CHECK ("user"."platform_role" IN ('user', 'staff', 'admin')),
	CONSTRAINT "user_status_check" CHECK ("user"."status" IN ('active', 'suspended', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"contact_email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learners_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "learners_status_check" CHECK ("learners"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "organization_learners" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"learner_id" text NOT NULL,
	"employee_reference" text,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_learners_status_check" CHECK ("organization_learners"."status" IN ('active', 'inactive')),
	CONSTRAINT "organization_learners_dates_check" CHECK ("organization_learners"."left_at" IS NULL OR "organization_learners"."left_at" >= "organization_learners"."joined_at")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_memberships_role_check" CHECK ("organization_memberships"."role" IN ('owner', 'manager', 'billing', 'viewer')),
	CONSTRAINT "organization_memberships_status_check" CHECK ("organization_memberships"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_status_check" CHECK ("organizations"."status" IN ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_number" text NOT NULL,
	"learner_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"recipient_name_snapshot" text NOT NULL,
	"credential_title_snapshot" text NOT NULL,
	"issued_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp (3) with time zone,
	"revoked_at" timestamp (3) with time zone,
	"revocation_reason" text,
	"verification_code" text NOT NULL,
	"document_reference" text,
	"supersedes_certificate_id" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number"),
	CONSTRAINT "certificates_verification_code_unique" UNIQUE("verification_code"),
	CONSTRAINT "certificates_expiry_check" CHECK ("certificates"."expires_at" IS NULL OR "certificates"."expires_at" >= "certificates"."issued_at"),
	CONSTRAINT "certificates_revocation_date_check" CHECK ("certificates"."revoked_at" IS NULL OR "certificates"."revoked_at" >= "certificates"."issued_at"),
	CONSTRAINT "certificates_supersedes_check" CHECK ("certificates"."supersedes_certificate_id" IS NULL OR "certificates"."supersedes_certificate_id" != "certificates"."id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code"),
	CONSTRAINT "courses_status_check" CHECK ("courses"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"course_id" text NOT NULL,
	"order_item_id" text,
	"organization_id" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"enrolled_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp (3) with time zone,
	"completed_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_id_learner_unique" UNIQUE("id","learner_id"),
	CONSTRAINT "enrollments_status_check" CHECK ("enrollments"."status" IN ('not_started', 'in_progress', 'completed', 'failed', 'withdrawn', 'expired', 'revoked')),
	CONSTRAINT "enrollments_start_date_check" CHECK ("enrollments"."started_at" IS NULL OR "enrollments"."started_at" >= "enrollments"."enrolled_at"),
	CONSTRAINT "enrollments_completion_date_check" CHECK ("enrollments"."completed_at" IS NULL OR "enrollments"."completed_at" >= coalesce("enrollments"."started_at", "enrollments"."enrolled_at")),
	CONSTRAINT "enrollments_completed_timestamp_check" CHECK ("enrollments"."status" != 'completed' OR "enrollments"."completed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_price_id" text,
	"sku_snapshot" text NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"quantity" bigint NOT NULL,
	"unit_amount" bigint NOT NULL,
	"subtotal_amount" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" IS NULL OR ("order_items"."quantity" >= 1 AND "order_items"."quantity" <= 9007199254740991)),
	CONSTRAINT "order_items_unit_amount_check" CHECK ("order_items"."unit_amount" IS NULL OR ("order_items"."unit_amount" >= 0 AND "order_items"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_check" CHECK ("order_items"."subtotal_amount" IS NULL OR ("order_items"."subtotal_amount" >= 0 AND "order_items"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_discount_check" CHECK ("order_items"."discount_amount" IS NULL OR ("order_items"."discount_amount" >= 0 AND "order_items"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_tax_check" CHECK ("order_items"."tax_amount" IS NULL OR ("order_items"."tax_amount" >= 0 AND "order_items"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_total_check" CHECK ("order_items"."total_amount" IS NULL OR ("order_items"."total_amount" >= 0 AND "order_items"."total_amount" <= 9007199254740991)),
	CONSTRAINT "order_items_subtotal_arithmetic_check" CHECK ("order_items"."subtotal_amount" = "order_items"."unit_amount" * "order_items"."quantity"),
	CONSTRAINT "order_items_discount_limit_check" CHECK ("order_items"."discount_amount" <= "order_items"."subtotal_amount"),
	CONSTRAINT "order_items_total_arithmetic_check" CHECK ("order_items"."total_amount" = "order_items"."subtotal_amount" - "order_items"."discount_amount" + "order_items"."tax_amount")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"placed_by_user_id" text NOT NULL,
	"purchasing_organization_id" text,
	"purchaser_name_snapshot" text NOT NULL,
	"purchaser_email_snapshot" text NOT NULL,
	"billing_details_snapshot" jsonb NOT NULL,
	"currency" text NOT NULL,
	"subtotal_amount" bigint DEFAULT 0 NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"placed_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" IN ('draft', 'pending', 'confirmed', 'completed', 'canceled')),
	CONSTRAINT "orders_currency_check" CHECK ("orders"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "orders_subtotal_check" CHECK ("orders"."subtotal_amount" IS NULL OR ("orders"."subtotal_amount" >= 0 AND "orders"."subtotal_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_check" CHECK ("orders"."discount_amount" IS NULL OR ("orders"."discount_amount" >= 0 AND "orders"."discount_amount" <= 9007199254740991)),
	CONSTRAINT "orders_tax_check" CHECK ("orders"."tax_amount" IS NULL OR ("orders"."tax_amount" >= 0 AND "orders"."tax_amount" <= 9007199254740991)),
	CONSTRAINT "orders_total_check" CHECK ("orders"."total_amount" IS NULL OR ("orders"."total_amount" >= 0 AND "orders"."total_amount" <= 9007199254740991)),
	CONSTRAINT "orders_discount_limit_check" CHECK ("orders"."discount_amount" <= "orders"."subtotal_amount"),
	CONSTRAINT "orders_total_arithmetic_check" CHECK ("orders"."total_amount" = "orders"."subtotal_amount" - "orders"."discount_amount" + "orders"."tax_amount")
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"currency" text NOT NULL,
	"unit_amount" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp (3) with time zone,
	"valid_until" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_prices_id_product_unique" UNIQUE("id","product_id"),
	CONSTRAINT "product_prices_currency_check" CHECK ("product_prices"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "product_prices_amount_check" CHECK ("product_prices"."unit_amount" IS NULL OR ("product_prices"."unit_amount" >= 0 AND "product_prices"."unit_amount" <= 9007199254740991)),
	CONSTRAINT "product_prices_dates_check" CHECK ("product_prices"."valid_until" IS NULL OR "product_prices"."valid_from" IS NULL OR "product_prices"."valid_until" > "product_prices"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"product_type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_type_check" CHECK ("products"."product_type" IN ('course_access', 'course_package')),
	CONSTRAINT "products_status_check" CHECK ("products"."status" IN ('draft', 'active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_account_reference" text NOT NULL,
	"environment" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"order_id" text,
	"payment_id" text,
	"payload_json" jsonb NOT NULL,
	"processing_status" text DEFAULT 'received' NOT NULL,
	"received_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp (3) with time zone,
	"attempt_count" bigint DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_environment_check" CHECK ("payment_events"."environment" IN ('test', 'live')),
	CONSTRAINT "payment_events_status_check" CHECK ("payment_events"."processing_status" IN ('received', 'processing', 'processed', 'failed')),
	CONSTRAINT "payment_events_attempt_count_check" CHECK ("payment_events"."attempt_count" IS NULL OR ("payment_events"."attempt_count" >= 0 AND "payment_events"."attempt_count" <= 9007199254740991))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_reference" text NOT NULL,
	"provider_checkout_id" text,
	"provider_payment_id" text,
	"idempotency_key" text NOT NULL,
	"currency" text NOT NULL,
	"requested_amount" bigint NOT NULL,
	"captured_amount" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_status" text,
	"succeeded_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_status_check" CHECK ("payments"."status" IN ('pending', 'requires_action', 'processing', 'authorized', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "payments_currency_check" CHECK ("payments"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "payments_requested_amount_check" CHECK ("payments"."requested_amount" IS NULL OR ("payments"."requested_amount" >= 0 AND "payments"."requested_amount" <= 9007199254740991)),
	CONSTRAINT "payments_captured_amount_check" CHECK ("payments"."captured_amount" IS NULL OR ("payments"."captured_amount" >= 0 AND "payments"."captured_amount" <= 9007199254740991)),
	CONSTRAINT "payments_capture_limit_check" CHECK ("payments"."captured_amount" <= "payments"."requested_amount")
);
--> statement-breakpoint
CREATE TABLE "refund_items" (
	"id" text PRIMARY KEY NOT NULL,
	"refund_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"quantity" bigint,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_items_amount_check" CHECK ("refund_items"."amount" IS NULL OR ("refund_items"."amount" >= 1 AND "refund_items"."amount" <= 9007199254740991)),
	CONSTRAINT "refund_items_quantity_check" CHECK ("refund_items"."quantity" IS NULL OR ("refund_items"."quantity" >= 1 AND "refund_items"."quantity" <= 9007199254740991))
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"provider_refund_id" text,
	"idempotency_key" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by_user_id" text,
	"requested_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_status_check" CHECK ("refunds"."status" IN ('pending', 'succeeded', 'failed', 'canceled')),
	CONSTRAINT "refunds_currency_check" CHECK ("refunds"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "refunds_amount_check" CHECK ("refunds"."amount" IS NULL OR ("refunds"."amount" >= 1 AND "refunds"."amount" <= 9007199254740991)),
	CONSTRAINT "refunds_completed_date_check" CHECK ("refunds"."completed_at" IS NULL OR "refunds"."completed_at" >= "refunds"."requested_at")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_learners" ADD CONSTRAINT "organization_learners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_learners" ADD CONSTRAINT "organization_learners_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_supersedes_certificate_id_certificates_id_fk" FOREIGN KEY ("supersedes_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_learner_fk" FOREIGN KEY ("enrollment_id","learner_id") REFERENCES "public"."enrollments"("id","learner_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_product_fk" FOREIGN KEY ("product_price_id","product_id") REFERENCES "public"."product_prices"("id","product_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_placed_by_user_id_user_id_fk" FOREIGN KEY ("placed_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_purchasing_organization_id_organizations_id_fk" FOREIGN KEY ("purchasing_organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_identity_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_learners_pair_unique" ON "organization_learners" USING btree ("organization_id","learner_id");--> statement-breakpoint
CREATE INDEX "organization_learners_learner_idx" ON "organization_learners" USING btree ("learner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_pair_unique" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "certificates_learner_idx" ON "certificates" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "certificates_enrollment_idx" ON "certificates" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "enrollments_learner_idx" ON "enrollments" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "enrollments_order_item_idx" ON "enrollments" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "enrollments_organization_idx" ON "enrollments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("placed_by_user_id");--> statement-breakpoint
CREATE INDEX "orders_organization_idx" ON "orders" USING btree ("purchasing_organization_id");--> statement-breakpoint
CREATE INDEX "product_prices_product_idx" ON "product_prices" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_unique" ON "payment_events" USING btree ("provider","provider_account_reference","environment","provider_event_id");--> statement-breakpoint
CREATE INDEX "payment_events_payment_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_events_processing_idx" ON "payment_events" USING btree ("processing_status","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_unique" ON "payments" USING btree ("provider","provider_account_reference","provider_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_checkout_unique" ON "payments" USING btree ("provider","provider_account_reference","provider_checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_unique" ON "payments" USING btree ("provider","provider_account_reference","idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refund_items_refund_item_unique" ON "refund_items" USING btree ("refund_id","order_item_id");--> statement-breakpoint
CREATE INDEX "refund_items_order_item_idx" ON "refund_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_payment_provider_refund_unique" ON "refunds" USING btree ("payment_id","provider_refund_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_payment_idempotency_unique" ON "refunds" USING btree ("payment_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "refunds_payment_idx" ON "refunds" USING btree ("payment_id");