import { v4 as uuidv4, v7 as uuidv7 } from "uuid";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, pgTable, text, timestamp, unique, type AnyPgColumn } from "drizzle-orm/pg-core";
import { learners, organizations } from "./people.ts";
import { orderItems } from "./commerce.ts";

const courseStatuses = ["draft", "active", "archived"] as const;
const enrollmentStatuses = ["not_started", "in_progress", "completed", "failed", "withdrawn", "expired", "revoked"] as const;

export const courses = pgTable("courses", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: courseStatuses }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [check("courses_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`)]);

// This follows the current draft: course_id, without a course-version table.
export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "restrict" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "restrict" }),
  status: text("status", { enum: enrollmentStatuses }).notNull().default("not_started"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true, mode: "date", precision: 3 }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date", precision: 3 }),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date", precision: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("enrollments_id_learner_unique").on(t.id, t.learnerId),
  index("enrollments_learner_idx").on(t.learnerId),
  index("enrollments_course_idx").on(t.courseId),
  index("enrollments_order_item_idx").on(t.orderItemId),
  index("enrollments_organization_idx").on(t.organizationId),
  check("enrollments_status_check", sql`${t.status} IN ('not_started', 'in_progress', 'completed', 'failed', 'withdrawn', 'expired', 'revoked')`),
  check("enrollments_start_date_check", sql`${t.startedAt} IS NULL OR ${t.startedAt} >= ${t.enrolledAt}`),
  check("enrollments_completion_date_check", sql`${t.completedAt} IS NULL OR ${t.completedAt} >= coalesce(${t.startedAt}, ${t.enrolledAt})`),
  check("enrollments_completed_timestamp_check", sql`${t.status} != 'completed' OR ${t.completedAt} IS NOT NULL`),
]);

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey().notNull().$defaultFn(() => uuidv7()),
  certificateNumber: text("certificate_number").notNull().unique(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  enrollmentId: text("enrollment_id").notNull(),
  recipientNameSnapshot: text("recipient_name_snapshot").notNull(),
  credentialTitleSnapshot: text("credential_title_snapshot").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date", precision: 3 }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date", precision: 3 }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date", precision: 3 }),
  revocationReason: text("revocation_reason"),
  verificationCode: text("verification_code").notNull().unique().$defaultFn(() => uuidv4()),
  documentReference: text("document_reference"),
  supersedesCertificateId: text("supersedes_certificate_id").references((): AnyPgColumn => certificates.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date", precision: 3 })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  foreignKey({ name: "certificates_enrollment_learner_fk", columns: [t.enrollmentId, t.learnerId], foreignColumns: [enrollments.id, enrollments.learnerId] }).onDelete("restrict"),
  index("certificates_learner_idx").on(t.learnerId),
  index("certificates_enrollment_idx").on(t.enrollmentId),
  check("certificates_expiry_check", sql`${t.expiresAt} IS NULL OR ${t.expiresAt} >= ${t.issuedAt}`),
  check("certificates_revocation_date_check", sql`${t.revokedAt} IS NULL OR ${t.revokedAt} >= ${t.issuedAt}`),
  check("certificates_supersedes_check", sql`${t.supersedesCertificateId} IS NULL OR ${t.supersedesCertificateId} != ${t.id}`),
]);
