import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const platformRoles = ["user", "staff", "admin"] as const;
const userStatuses = ["active", "suspended", "archived"] as const;

// Better Auth expects the JS property `name`; SQL stores it as display_name.
// These are base Better Auth tables plus the two FANS user fields below.
// Verify/regenerate them against your final Better Auth config and plugins.
export const user = sqliteTable("user", {
  id: text("id").primaryKey().notNull().default(sql`(lower(
      hex(randomblob(4)) || '-' ||
      hex(randomblob(2)) || '-4' ||
      substr(hex(randomblob(2)), 2) || '-' ||
      substr('89ab', (random() & 3) + 1, 1) ||
      substr(hex(randomblob(2)), 2) || '-' ||
      hex(randomblob(6))
    ))`),
  name: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  platformRole: text("platform_role", { enum: platformRoles }).notNull().default("user"),
  status: text("status", { enum: userStatuses }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  check("user_platform_role_check", sql`${t.platformRole} IN ('user', 'staff', 'admin')`),
  check("user_status_check", sql`${t.status} IN ('active', 'suspended', 'archived')`),
  check("user_email_verified_check", sql`${t.emailVerified} IN (0, 1)`),
]);

export const session = sqliteTable("session", {
  id: text("id").primaryKey().notNull().default(sql`(lower(
      hex(randomblob(4)) || '-' ||
      hex(randomblob(2)) || '-4' ||
      substr(hex(randomblob(2)), 2) || '-' ||
      substr('89ab', (random() & 3) + 1, 1) ||
      substr(hex(randomblob(2)), 2) || '-' ||
      hex(randomblob(6))
    ))`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [index("session_user_idx").on(t.userId)]);

export const account = sqliteTable("account", {
  id: text("id").primaryKey().notNull().default(sql`(lower(
      hex(randomblob(4)) || '-' ||
      hex(randomblob(2)) || '-4' ||
      substr(hex(randomblob(2)), 2) || '-' ||
      substr('89ab', (random() & 3) + 1, 1) ||
      substr(hex(randomblob(2)), 2) || '-' ||
      hex(randomblob(6))
    ))`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"), // Better Auth password hash, never a plaintext password.
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [
  uniqueIndex("account_provider_identity_unique").on(t.providerId, t.accountId),
  index("account_user_idx").on(t.userId),
]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey().notNull().default(sql`(lower(
      hex(randomblob(4)) || '-' ||
      hex(randomblob(2)) || '-4' ||
      substr(hex(randomblob(2)), 2) || '-' ||
      substr('89ab', (random() & 3) + 1, 1) ||
      substr(hex(randomblob(2)), 2) || '-' ||
      hex(randomblob(6))
    ))`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);
