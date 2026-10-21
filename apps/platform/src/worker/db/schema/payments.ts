import { v7 as uuidv7 } from "uuid";
import { sql } from "drizzle-orm";
import { bigint, check, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { orders, orderItems } from "./commerce.ts";

const paymentStatuses = ["pending", "requires_action", "processing", "authorized", "succeeded", "failed", "canceled"] as const;
const refundStatuses = ["pending", "succeeded", "failed", "canceled"] as const;
const eventStatuses = ["received", "processing", "processed", "failed"] as const;
const environments = ["test", "live"] as const;

export const payments = pgTable("payments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  provider: text("provider").notNull(),
  providerAccountReference: text("provider_account_reference").notNull(),
  providerCheckoutId: text("provider_checkout_id"),
  providerPaymentId: text("provider_payment_id"),
  idempotencyKey: text("idempotency_key").notNull(),
  currency: text("currency").notNull(),
  requestedAmount: bigint("requested_amount", { mode: "number" }).notNull(),
  capturedAmount: bigint("captured_amount", { mode: "number" }).notNull().default(0),
  status: text("status", { enum: paymentStatuses }).notNull().default("pending"),
  providerStatus: text("provider_status"),
  succeededAt: timestamp("succeeded_at", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("payments_provider_payment_unique").on(t.provider, t.providerAccountReference, t.providerPaymentId),
  uniqueIndex("payments_provider_checkout_unique").on(t.provider, t.providerAccountReference, t.providerCheckoutId),
  uniqueIndex("payments_idempotency_unique").on(t.provider, t.providerAccountReference, t.idempotencyKey),
  index("payments_order_idx").on(t.orderId),
  check("payments_status_check", sql`${t.status} IN ('pending', 'requires_action', 'processing', 'authorized', 'succeeded', 'failed', 'canceled')`),
  check("payments_currency_check", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  check("payments_requested_amount_check", sql`${t.requestedAmount} IS NULL OR (${t.requestedAmount} >= 0 AND ${t.requestedAmount} <= 9007199254740991)`),
  check("payments_captured_amount_check", sql`${t.capturedAmount} IS NULL OR (${t.capturedAmount} >= 0 AND ${t.capturedAmount} <= 9007199254740991)`),
  check("payments_capture_limit_check", sql`${t.capturedAmount} <= ${t.requestedAmount}`),
]);

export const refunds = pgTable("refunds", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  paymentId: text("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
  providerRefundId: text("provider_refund_id"),
  idempotencyKey: text("idempotency_key").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: refundStatuses }).notNull().default("pending"),
  requestedByUserId: text("requested_by_user_id").references(() => user.id, { onDelete: "restrict" }),
  requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date", precision: 3 }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("refunds_payment_provider_refund_unique").on(t.paymentId, t.providerRefundId),
  uniqueIndex("refunds_payment_idempotency_unique").on(t.paymentId, t.idempotencyKey),
  index("refunds_payment_idx").on(t.paymentId),
  check("refunds_status_check", sql`${t.status} IN ('pending', 'succeeded', 'failed', 'canceled')`),
  check("refunds_currency_check", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  check("refunds_amount_check", sql`${t.amount} IS NULL OR (${t.amount} >= 1 AND ${t.amount} <= 9007199254740991)`),
  check("refunds_completed_date_check", sql`${t.completedAt} IS NULL OR ${t.completedAt} >= ${t.requestedAt}`),
]);

export const refundItems = pgTable("refund_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  refundId: text("refund_id").notNull().references(() => refunds.id, { onDelete: "restrict" }),
  orderItemId: text("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  quantity: bigint("quantity", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("refund_items_refund_item_unique").on(t.refundId, t.orderItemId),
  index("refund_items_order_item_idx").on(t.orderItemId),
  check("refund_items_amount_check", sql`${t.amount} IS NULL OR (${t.amount} >= 1 AND ${t.amount} <= 9007199254740991)`),
  check("refund_items_quantity_check", sql`${t.quantity} IS NULL OR (${t.quantity} >= 1 AND ${t.quantity} <= 9007199254740991)`),
]);

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  provider: text("provider").notNull(),
  providerAccountReference: text("provider_account_reference").notNull(),
  environment: text("environment", { enum: environments }).notNull(),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "restrict" }),
  paymentId: text("payment_id").references(() => payments.id, { onDelete: "restrict" }),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull(),
  processingStatus: text("processing_status", { enum: eventStatuses }).notNull().default("received"),
  receivedAt: timestamp("received_at", { withTimezone: true, mode: "date", precision: 3 }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "date", precision: 3 }),
  attemptCount: bigint("attempt_count", { mode: "number" }).notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("payment_events_provider_event_unique").on(t.provider, t.providerAccountReference, t.environment, t.providerEventId),
  index("payment_events_payment_idx").on(t.paymentId),
  index("payment_events_order_idx").on(t.orderId),
  index("payment_events_processing_idx").on(t.processingStatus, t.receivedAt),
  check("payment_events_environment_check", sql`${t.environment} IN ('test', 'live')`),
  check("payment_events_status_check", sql`${t.processingStatus} IN ('received', 'processing', 'processed', 'failed')`),
  check("payment_events_attempt_count_check", sql`${t.attemptCount} IS NULL OR (${t.attemptCount} >= 0 AND ${t.attemptCount} <= 9007199254740991)`),
]);
