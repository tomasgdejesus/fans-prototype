import { sql } from "drizzle-orm";
import { bigint, boolean, check, foreignKey, index, jsonb, pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { organizations } from "./people.ts";

const productTypes = ["course_access", "course_package"] as const;
const productStatuses = ["draft", "active", "archived"] as const;
const orderStatuses = ["draft", "pending", "confirmed", "completed", "canceled"] as const;

export const products = pgTable("products", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  productType: text("product_type", { enum: productTypes }).notNull(),
  status: text("status", { enum: productStatuses }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  check("products_type_check", sql`${t.productType} IN ('course_access', 'course_package')`),
  check("products_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`),
]);

export const productPrices = pgTable("product_prices", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  currency: text("currency").notNull(),
  unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
  active: boolean("active").notNull().default(true),
  validFrom: timestamp("valid_from", { withTimezone: true, mode: "date", precision: 3 }),
  validUntil: timestamp("valid_until", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  unique("product_prices_id_product_unique").on(t.id, t.productId),
  index("product_prices_product_idx").on(t.productId),
  check("product_prices_currency_check", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  check("product_prices_amount_check", sql`${t.unitAmount} IS NULL OR (${t.unitAmount} >= 0 AND ${t.unitAmount} <= 9007199254740991)`),
  check("product_prices_dates_check", sql`${t.validUntil} IS NULL OR ${t.validFrom} IS NULL OR ${t.validUntil} > ${t.validFrom}`),
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  orderNumber: text("order_number").notNull().unique(),
  placedByUserId: uuid("placed_by_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  purchasingOrganizationId: uuid("purchasing_organization_id").references(() => organizations.id, { onDelete: "restrict" }),
  purchaserNameSnapshot: text("purchaser_name_snapshot").notNull(),
  purchaserEmailSnapshot: text("purchaser_email_snapshot").notNull(),
  billingDetailsSnapshot: jsonb("billing_details_snapshot").$type<Record<string, unknown>>().notNull(),
  currency: text("currency").notNull(),
  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull().default(0),
  discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
  taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
  status: text("status", { enum: orderStatuses }).notNull().default("draft"),
  placedAt: timestamp("placed_at", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  index("orders_user_idx").on(t.placedByUserId),
  index("orders_organization_idx").on(t.purchasingOrganizationId),
  check("orders_status_check", sql`${t.status} IN ('draft', 'pending', 'confirmed', 'completed', 'canceled')`),
  check("orders_currency_check", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  check("orders_subtotal_check", sql`${t.subtotalAmount} IS NULL OR (${t.subtotalAmount} >= 0 AND ${t.subtotalAmount} <= 9007199254740991)`),
  check("orders_discount_check", sql`${t.discountAmount} IS NULL OR (${t.discountAmount} >= 0 AND ${t.discountAmount} <= 9007199254740991)`),
  check("orders_tax_check", sql`${t.taxAmount} IS NULL OR (${t.taxAmount} >= 0 AND ${t.taxAmount} <= 9007199254740991)`),
  check("orders_total_check", sql`${t.totalAmount} IS NULL OR (${t.totalAmount} >= 0 AND ${t.totalAmount} <= 9007199254740991)`),
  check("orders_discount_limit_check", sql`${t.discountAmount} <= ${t.subtotalAmount}`),
  check("orders_total_arithmetic_check", sql`${t.totalAmount} = ${t.subtotalAmount} - ${t.discountAmount} + ${t.taxAmount}`),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  productPriceId: uuid("product_price_id"),
  skuSnapshot: text("sku_snapshot").notNull(),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  quantity: bigint("quantity", { mode: "number" }).notNull(),
  unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
  discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
  taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "order_items_price_product_fk", columns: [t.productPriceId, t.productId], foreignColumns: [productPrices.id, productPrices.productId] }).onDelete("restrict"),
  index("order_items_order_idx").on(t.orderId),
  index("order_items_product_idx").on(t.productId),
  check("order_items_quantity_check", sql`${t.quantity} IS NULL OR (${t.quantity} >= 1 AND ${t.quantity} <= 9007199254740991)`),
  check("order_items_unit_amount_check", sql`${t.unitAmount} IS NULL OR (${t.unitAmount} >= 0 AND ${t.unitAmount} <= 9007199254740991)`),
  check("order_items_subtotal_check", sql`${t.subtotalAmount} IS NULL OR (${t.subtotalAmount} >= 0 AND ${t.subtotalAmount} <= 9007199254740991)`),
  check("order_items_discount_check", sql`${t.discountAmount} IS NULL OR (${t.discountAmount} >= 0 AND ${t.discountAmount} <= 9007199254740991)`),
  check("order_items_tax_check", sql`${t.taxAmount} IS NULL OR (${t.taxAmount} >= 0 AND ${t.taxAmount} <= 9007199254740991)`),
  check("order_items_total_check", sql`${t.totalAmount} IS NULL OR (${t.totalAmount} >= 0 AND ${t.totalAmount} <= 9007199254740991)`),
  check("order_items_subtotal_arithmetic_check", sql`${t.subtotalAmount} = ${t.unitAmount} * ${t.quantity}`),
  check("order_items_discount_limit_check", sql`${t.discountAmount} <= ${t.subtotalAmount}`),
  check("order_items_total_arithmetic_check", sql`${t.totalAmount} = ${t.subtotalAmount} - ${t.discountAmount} + ${t.taxAmount}`),
]);
