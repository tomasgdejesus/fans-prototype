import { describe, expect, it } from "vitest";
import { registrationFormSchema, resetPasswordFormSchema } from "../../../features/auth/form-schemas";

describe.each([
  { name: "registration", schema: registrationFormSchema, extra: { email: "learner@example.com" } },
  { name: "password reset", schema: resetPasswordFormSchema, extra: {} },
])("$name form", ({ schema, extra }) => {
  it("requires confirmation and attaches mismatches to its field", () => {
    for (const confirmPassword of [undefined, "", "different-password"]) {
      const result = schema.safeParse({ ...extra, password: "example-password", confirmPassword });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
    }
  });

  it("compares the exact passwords, including whitespace", () => {
    const password = " example-password ";
    expect(schema.safeParse({ ...extra, password, confirmPassword: password }).success).toBe(true);
    expect(schema.safeParse({ ...extra, password, confirmPassword: password.trim() }).success).toBe(false);
  });
});
