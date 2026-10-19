import { v7 as uuidv7 } from "uuid";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth.ts";
import { orders, orderItems } from "./commerce.ts";

const paymentStatuses = ["pending", "requires_action", "processing", "authorized", "succeeded", "failed", "canceled"] as const;
const refundStatuses = ["pending", "succeeded", "failed", "canceled"] as const;
const eventStatuses = ["received", "processing", "processed", "failed"] as const;
const environments = ["test", "live"] as const;

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  provider: text("provider").notNull(),
  providerAccountReference: text("provider_account_reference").notNull(),
  providerCheckoutId: text("provider_checkout_id"),
  providerPaymentId: text("provider_payment_id"),
  idempotencyKey: text("idempotency_key").notNull(),
  currency: text("currency").notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  capturedAmount: integer("captured_amount").notNull().default(0),
  status: text("status", { enum: paymentStatuses }).notNull().default("pending"),
  providerStatus: text("provider_status"),
  succeededAt: integer("succeeded_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("payments_provider_payment_unique").on(t.provider, t.providerAccountReference, t.providerPaymentId),
  uniqueIndex("payments_provider_checkout_unique").on(t.provider, t.providerAccountReference, t.providerCheckoutId),
  uniqueIndex("payments_idempotency_unique").on(t.provider, t.providerAccountReference, t.idempotencyKey),
  index("payments_order_idx").on(t.orderId),
  check("payments_status_check", sql`${t.status} IN ('pending', 'requires_action', 'processing', 'authorized', 'succeeded', 'failed', 'canceled')`),
  check("payments_currency_check", sql`${t.currency} GLOB '[A-Z][A-Z][A-Z]'`),
  check("payments_requested_amount_check", sql`${t.requestedAmount} IS NULL OR (typeof(${t.requestedAmount}) = 'integer' AND ${t.requestedAmount} >= 0 AND ${t.requestedAmount} <= 9007199254740991)`),
  check("payments_captured_amount_check", sql`${t.capturedAmount} IS NULL OR (typeof(${t.capturedAmount}) = 'integer' AND ${t.capturedAmount} >= 0 AND ${t.capturedAmount} <= 9007199254740991)`),
  check("payments_capture_limit_check", sql`${t.capturedAmount} <= ${t.requestedAmount}`),
]);

export const refunds = sqliteTable("refunds", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  paymentId: text("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
  providerRefundId: text("provider_refund_id"),
  idempotencyKey: text("idempotency_key").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: refundStatuses }).notNull().default("pending"),
  requestedByUserId: text("requested_by_user_id").references(() => user.id, { onDelete: "restrict" }),
  requestedAt: integer("requested_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("refunds_payment_provider_refund_unique").on(t.paymentId, t.providerRefundId),
  uniqueIndex("refunds_payment_idempotency_unique").on(t.paymentId, t.idempotencyKey),
  index("refunds_payment_idx").on(t.paymentId),
  check("refunds_status_check", sql`${t.status} IN ('pending', 'succeeded', 'failed', 'canceled')`),
  check("refunds_currency_check", sql`${t.currency} GLOB '[A-Z][A-Z][A-Z]'`),
  check("refunds_amount_check", sql`${t.amount} IS NULL OR (typeof(${t.amount}) = 'integer' AND ${t.amount} >= 1 AND ${t.amount} <= 9007199254740991)`),
  check("refunds_completed_date_check", sql`${t.completedAt} IS NULL OR ${t.completedAt} >= ${t.requestedAt}`),
]);

export const refundItems = sqliteTable("refund_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  refundId: text("refund_id").notNull().references(() => refunds.id, { onDelete: "restrict" }),
  orderItemId: text("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  quantity: integer("quantity"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("refund_items_refund_item_unique").on(t.refundId, t.orderItemId),
  index("refund_items_order_item_idx").on(t.orderItemId),
  check("refund_items_amount_check", sql`${t.amount} IS NULL OR (typeof(${t.amount}) = 'integer' AND ${t.amount} >= 1 AND ${t.amount} <= 9007199254740991)`),
  check("refund_items_quantity_check", sql`${t.quantity} IS NULL OR (typeof(${t.quantity}) = 'integer' AND ${t.quantity} >= 1 AND ${t.quantity} <= 9007199254740991)`),
]);

export const paymentEvents = sqliteTable("payment_events", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  provider: text("provider").notNull(),
  providerAccountReference: text("provider_account_reference").notNull(),
  environment: text("environment", { enum: environments }).notNull(),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "restrict" }),
  paymentId: text("payment_id").references(() => payments.id, { onDelete: "restrict" }),
  payloadJson: text("payload_json", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  processingStatus: text("processing_status", { enum: eventStatuses }).notNull().default("received"),
  receivedAt: integer("received_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("payment_events_provider_event_unique").on(t.provider, t.providerAccountReference, t.environment, t.providerEventId),
  index("payment_events_payment_idx").on(t.paymentId),
  index("payment_events_order_idx").on(t.orderId),
  index("payment_events_processing_idx").on(t.processingStatus, t.receivedAt),
  check("payment_events_environment_check", sql`${t.environment} IN ('test', 'live')`),
  check("payment_events_status_check", sql`${t.processingStatus} IN ('received', 'processing', 'processed', 'failed')`),
  check("payment_events_attempt_count_check", sql`${t.attemptCount} IS NULL OR (typeof(${t.attemptCount}) = 'integer' AND ${t.attemptCount} >= 0 AND ${t.attemptCount} <= 9007199254740991)`),
  check("payment_events_payload_json_check", sql`json_valid(${t.payloadJson})`),
]);
