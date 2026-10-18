import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, sqliteTable, text, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { learners, organizations } from "./people.ts";
import { orderItems } from "./commerce.ts";

const courseStatuses = ["draft", "active", "archived"] as const;
const enrollmentStatuses = ["not_started", "in_progress", "completed", "failed", "withdrawn", "expired", "revoked"] as const;

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: courseStatuses }).notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [check("courses_status_check", sql`${t.status} IN ('draft', 'active', 'archived')`)]);

// This follows the current draft: course_id, without a course-version table.
export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  orderItemId: text("order_item_id").references(() => orderItems.id, { onDelete: "restrict" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "restrict" }),
  status: text("status", { enum: enrollmentStatuses }).notNull().default("not_started"),
  enrolledAt: integer("enrolled_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("enrollments_id_learner_unique").on(t.id, t.learnerId),
  index("enrollments_learner_idx").on(t.learnerId),
  index("enrollments_course_idx").on(t.courseId),
  index("enrollments_order_item_idx").on(t.orderItemId),
  index("enrollments_organization_idx").on(t.organizationId),
  check("enrollments_status_check", sql`${t.status} IN ('not_started', 'in_progress', 'completed', 'failed', 'withdrawn', 'expired', 'revoked')`),
  check("enrollments_start_date_check", sql`${t.startedAt} IS NULL OR ${t.startedAt} >= ${t.enrolledAt}`),
  check("enrollments_completion_date_check", sql`${t.completedAt} IS NULL OR ${t.completedAt} >= coalesce(${t.startedAt}, ${t.enrolledAt})`),
  check("enrollments_completed_timestamp_check", sql`${t.status} != 'completed' OR ${t.completedAt} IS NOT NULL`),
]);

export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  certificateNumber: text("certificate_number").notNull().unique(),
  learnerId: text("learner_id").notNull().references(() => learners.id, { onDelete: "restrict" }),
  enrollmentId: text("enrollment_id").notNull(),
  recipientNameSnapshot: text("recipient_name_snapshot").notNull(),
  credentialTitleSnapshot: text("credential_title_snapshot").notNull(),
  issuedAt: integer("issued_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  revocationReason: text("revocation_reason"),
  verificationCode: text("verification_code").notNull().unique().$defaultFn(() => crypto.randomUUID()),
  documentReference: text("document_reference"),
  supersedesCertificateId: text("supersedes_certificate_id").references((): AnySQLiteColumn => certificates.id, { onDelete: "restrict" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull().default(sql`(unixepoch() * 1000)`).$onUpdate(() => new Date()),
}, (t) => [
  foreignKey({ name: "certificates_enrollment_learner_fk", columns: [t.enrollmentId, t.learnerId], foreignColumns: [enrollments.id, enrollments.learnerId] }).onDelete("restrict"),
  index("certificates_learner_idx").on(t.learnerId),
  index("certificates_enrollment_idx").on(t.enrollmentId),
  check("certificates_expiry_check", sql`${t.expiresAt} IS NULL OR ${t.expiresAt} >= ${t.issuedAt}`),
  check("certificates_revocation_date_check", sql`${t.revokedAt} IS NULL OR ${t.revokedAt} >= ${t.issuedAt}`),
  check("certificates_supersedes_check", sql`${t.supersedesCertificateId} IS NULL OR ${t.supersedesCertificateId} != ${t.id}`),
]);
