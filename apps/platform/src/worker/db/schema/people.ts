import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth.ts";

const recordStatuses = ["active", "archived"] as const;
const membershipStatuses = ["active", "inactive"] as const;
const organizationRoles = ["owner", "manager", "billing", "viewer"] as const;

export const learners = sqliteTable("learners", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").unique().references(() => user.id, { onDelete: "restrict" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  contactEmail: text("contact_email"),
  status: text("status", { enum: recordStatuses }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [check("learners_status_check", sql`${t.status} IN ('active', 'archived')`)]);

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status", { enum: recordStatuses }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [check("organizations_status_check", sql`${t.status} IN ('active', 'archived')`)]);

export const organizationMemberships = sqliteTable("organization_memberships", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  role: text("role", { enum: organizationRoles }).notNull(),
  status: text("status", { enum: membershipStatuses }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("organization_memberships_pair_unique").on(t.organizationId, t.userId),
  index("organization_memberships_user_idx").on(t.userId),
  check("organization_memberships_role_check", sql`${t.role} IN ('owner', 'manager', 'billing', 'viewer')`),
  check("organization_memberships_status_check", sql`${t.status} IN ('active', 'inactive')`),
]);

export const organizationLearners = sqliteTable("organization_learners", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  employeeReference: text("employee_reference"),
  status: text("status", { enum: membershipStatuses }).notNull().default("active"),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  leftAt: integer("left_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("organization_learners_pair_unique").on(t.organizationId, t.learnerId),
  index("organization_learners_learner_idx").on(t.learnerId),
  check("organization_learners_status_check", sql`${t.status} IN ('active', 'inactive')`),
  check("organization_learners_dates_check", sql`${t.leftAt} IS NULL OR ${t.leftAt} >= ${t.joinedAt}`),
]);
