import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

const platformRoles = ["user", "staff", "admin"] as const;
const userStatuses = ["active", "suspended", "archived"] as const;

// Better Auth expects the JS property `name`; SQL stores it as display_name.
// These are base Better Auth tables plus the two FANS user fields below.
// Verify/regenerate them against your final Better Auth config and plugins.
export const user = pgTable("user", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  name: text("display_name").notNull(), // Placeholder: "FANS User" ; may be changed by User in their dashboard
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  platformRole: text("platform_role", { enum: platformRoles }).notNull().default("user"),
  status: text("status", { enum: userStatuses }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  check("user_platform_role_check", sql`${t.platformRole} IN ('user', 'staff', 'admin')`),
  check("user_status_check", sql`${t.status} IN ('active', 'suspended', 'archived')`),
]);

export const session = pgTable("session", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date", precision: 3 }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [index("session_user_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: "date", precision: 3 }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: "date", precision: 3 }),
  scope: text("scope"),
  password: text("password"), // Better Auth password hash, never a plaintext password.
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  uniqueIndex("account_provider_identity_unique").on(t.providerId, t.accountId),
  index("account_user_idx").on(t.userId),
]);

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date", precision: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);
