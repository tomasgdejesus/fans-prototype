import { v7 as uuidv7 } from "uuid";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth.ts";
import { organizations } from "./people.ts";

const productTypes = ["course_access", "course_package"] as const;
const productStatuses = ["draft", "active", "archived"] as const;
const orderStatuses = ["draft", "pending", "confirmed", "completed", "canceled"] as const;

export const products = sqliteTable("products", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  productType: text("product_type", { enum: productTypes }).notNull(),
  status: text("status", { enum: productStatuses }).notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  check("products_type_check", sql`${t.productType} IN ('course_access', 'course_package')`),
  check("products_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
]);

export const productPrices = sqliteTable("product_prices", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  currency: text("currency").notNull(),
  unitAmount: integer("unit_amount").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  validFrom: integer("valid_from", { mode: "timestamp_ms" }),
  validUntil: integer("valid_until", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("product_prices_id_product_unique").on(t.id, t.productId),
  index("product_prices_product_idx").on(t.productId),
  check("product_prices_currency_check", sql`${t.currency} GLOB '[A-Z][A-Z][A-Z]'`),
  check("product_prices_amount_check", sql`${t.unitAmount} IS NULL OR (typeof(${t.unitAmount}) = 'integer' AND ${t.unitAmount} >= 0 AND ${t.unitAmount} <= 9007199254740991)`),
  check("product_prices_active_check", sql`${t.active} IN (0, 1)`),
  check("product_prices_dates_check", sql`${t.validUntil} IS NULL OR ${t.validFrom} IS NULL OR ${t.validUntil} > ${t.validFrom}`),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  orderNumber: text("order_number").notNull().unique(),
  placedByUserId: text("placed_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  purchasingOrganizationId: text("purchasing_organization_id").references(() => organizations.id, { onDelete: "restrict" }),
  purchaserNameSnapshot: text("purchaser_name_snapshot").notNull(),
  purchaserEmailSnapshot: text("purchaser_email_snapshot").notNull(),
  billingDetailsSnapshot: text("billing_details_snapshot", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  currency: text("currency").notNull(),
  subtotalAmount: integer("subtotal_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  status: text("status", { enum: orderStatuses }).notNull().default("draft"),
  placedAt: integer("placed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  index("orders_user_idx").on(t.placedByUserId),
  index("orders_organization_idx").on(t.purchasingOrganizationId),
  check("orders_status_check", sql`${t.status} IN ('draft', 'pending', 'confirmed', 'completed', 'canceled')`),
  check("orders_currency_check", sql`${t.currency} GLOB '[A-Z][A-Z][A-Z]'`),
  check("orders_subtotal_check", sql`${t.subtotalAmount} IS NULL OR (typeof(${t.subtotalAmount}) = 'integer' AND ${t.subtotalAmount} >= 0 AND ${t.subtotalAmount} <= 9007199254740991)`),
  check("orders_discount_check", sql`${t.discountAmount} IS NULL OR (typeof(${t.discountAmount}) = 'integer' AND ${t.discountAmount} >= 0 AND ${t.discountAmount} <= 9007199254740991)`),
  check("orders_tax_check", sql`${t.taxAmount} IS NULL OR (typeof(${t.taxAmount}) = 'integer' AND ${t.taxAmount} >= 0 AND ${t.taxAmount} <= 9007199254740991)`),
  check("orders_total_check", sql`${t.totalAmount} IS NULL OR (typeof(${t.totalAmount}) = 'integer' AND ${t.totalAmount} >= 0 AND ${t.totalAmount} <= 9007199254740991)`),
  check("orders_discount_limit_check", sql`${t.discountAmount} <= ${t.subtotalAmount}`),
  check("orders_total_arithmetic_check", sql`${t.totalAmount} = ${t.subtotalAmount} - ${t.discountAmount} + ${t.taxAmount}`),
  check("orders_billing_json_check", sql`json_valid(${t.billingDetailsSnapshot})`),
]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  productPriceId: text("product_price_id"),
  skuSnapshot: text("sku_snapshot").notNull(),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  unitAmount: integer("unit_amount").notNull(),
  subtotalAmount: integer("subtotal_amount").notNull(),
  discountAmount: integer("discount_amount").notNull().default(0),
  taxAmount: integer("tax_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  foreignKey({ name: "order_items_price_product_fk", columns: [t.productPriceId, t.productId], foreignColumns: [productPrices.id, productPrices.productId] }).onDelete("restrict"),
  index("order_items_order_idx").on(t.orderId),
  index("order_items_product_idx").on(t.productId),
  check("order_items_quantity_check", sql`${t.quantity} IS NULL OR (typeof(${t.quantity}) = 'integer' AND ${t.quantity} >= 1 AND ${t.quantity} <= 9007199254740991)`),
  check("order_items_unit_amount_check", sql`${t.unitAmount} IS NULL OR (typeof(${t.unitAmount}) = 'integer' AND ${t.unitAmount} >= 0 AND ${t.unitAmount} <= 9007199254740991)`),
  check("order_items_subtotal_check", sql`${t.subtotalAmount} IS NULL OR (typeof(${t.subtotalAmount}) = 'integer' AND ${t.subtotalAmount} >= 0 AND ${t.subtotalAmount} <= 9007199254740991)`),
  check("order_items_discount_check", sql`${t.discountAmount} IS NULL OR (typeof(${t.discountAmount}) = 'integer' AND ${t.discountAmount} >= 0 AND ${t.discountAmount} <= 9007199254740991)`),
  check("order_items_tax_check", sql`${t.taxAmount} IS NULL OR (typeof(${t.taxAmount}) = 'integer' AND ${t.taxAmount} >= 0 AND ${t.taxAmount} <= 9007199254740991)`),
  check("order_items_total_check", sql`${t.totalAmount} IS NULL OR (typeof(${t.totalAmount}) = 'integer' AND ${t.totalAmount} >= 0 AND ${t.totalAmount} <= 9007199254740991)`),
  check("order_items_subtotal_arithmetic_check", sql`${t.subtotalAmount} = ${t.unitAmount} * ${t.quantity}`),
  check("order_items_discount_limit_check", sql`${t.discountAmount} <= ${t.subtotalAmount}`),
  check("order_items_total_arithmetic_check", sql`${t.totalAmount} = ${t.subtotalAmount} - ${t.discountAmount} + ${t.taxAmount}`),
]);
