CREATE OR REPLACE FUNCTION "public"."fans_set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := statement_timestamp()::timestamptz(3);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."account"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."session"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."user"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."verification"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."learners"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."organization_learners"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."organization_memberships"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."organizations"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."certificates"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."courses"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."enrollments"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."order_items"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."orders"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."product_prices"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."products"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."payment_events"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."payments"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."refund_items"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "fans_set_updated_at" BEFORE UPDATE ON "public"."refunds"
FOR EACH ROW EXECUTE FUNCTION "public"."fans_set_updated_at"();
