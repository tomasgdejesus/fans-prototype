import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

const recordStatuses = ["active", "archived"] as const;
const membershipStatuses = ["active", "inactive"] as const;
const organizationRoles = ["owner", "manager", "billing", "viewer"] as const;

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  userId: uuid("user_id").unique().references(() => user.id, { onDelete: "restrict" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  contactEmail: text("contact_email"),
  status: text("status", { enum: recordStatuses }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [check("learners_status_check", sql`${t.status} IN ('active', 'archived')`)]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status", { enum: recordStatuses }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [check("organizations_status_check", sql`${t.status} IN ('active', 'archived')`)]);

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  role: text("role", { enum: organizationRoles }).notNull(),
  status: text("status", { enum: membershipStatuses }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  uniqueIndex("organization_memberships_pair_unique").on(t.organizationId, t.userId),
  index("organization_memberships_user_idx").on(t.userId),
  check("organization_memberships_role_check", sql`${t.role} IN ('owner', 'manager', 'billing', 'viewer')`),
  check("organization_memberships_status_check", sql`${t.status} IN ('active', 'inactive')`),
]);

export const organizationLearners = pgTable("organization_learners", {
  id: uuid("id").primaryKey().notNull().default(sql`uuidv7()`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  employeeReference: text("employee_reference"),
  status: text("status", { enum: membershipStatuses }).notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date", precision: 3 }).notNull().defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
}, (t) => [
  uniqueIndex("organization_learners_pair_unique").on(t.organizationId, t.learnerId),
  index("organization_learners_learner_idx").on(t.learnerId),
  check("organization_learners_status_check", sql`${t.status} IN ('active', 'inactive')`),
  check("organization_learners_dates_check", sql`${t.leftAt} IS NULL OR ${t.leftAt} >= ${t.joinedAt}`),
]);
