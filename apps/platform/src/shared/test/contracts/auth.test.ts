import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../constants/auth";
import { emailInputSchema, loginInputSchema, registrationInputSchema, resetPasswordInputSchema } from "../../contracts/auth";

describe("auth input contracts", () => {
  it("trims email before validation without changing its case", () => {
    expect(emailInputSchema.parse({ email: "  Learner+class@example.com  " })).toEqual({ email: "Learner+class@example.com" });
  });

  it.each(["", "   ", "learner", "learner@", "learner @example.com", "learner@example", ".learner@example.com", "learner..name@example.com"])("rejects an invalid email: %j", (email) => {
    expect(emailInputSchema.safeParse({ email }).success).toBe(false);
  });

  it.each(["learner+class@example.com", "first.last@example.co.uk", "learner@example.invalid"])("accepts a normal email: %s", (email) => {
    expect(emailInputSchema.safeParse({ email }).success).toBe(true);
  });

  it.each([PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH])("accepts a new password at the %i-character boundary", (length) => {
    const password = "x".repeat(length);
    expect(registrationInputSchema.parse({ email: "learner@example.com", password }).password).toBe(password);
    expect(resetPasswordInputSchema.parse({ token: "opaque-token", password }).password).toBe(password);
  });

  it.each([0, PASSWORD_MIN_LENGTH - 1, PASSWORD_MAX_LENGTH + 1])("rejects a new password of length %i in registration and reset", (length) => {
    const password = "x".repeat(length);
    expect(registrationInputSchema.safeParse({ email: "learner@example.com", password }).success).toBe(false);
    expect(resetPasswordInputSchema.safeParse({ token: "opaque-token", password }).success).toBe(false);
  });

  it("preserves password whitespace and Unicode without normalization", () => {
    const password = "  Cafe\u0301-🔐  ";
    expect(registrationInputSchema.parse({ email: "learner@example.com", password }).password).toBe(password);
    expect(resetPasswordInputSchema.parse({ token: "opaque-token", password }).password).toBe(password);
  });

  it("measures Unicode password boundaries the same way as Better Auth", () => {
    for (const length of [PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH]) {
      const password = "🔐".repeat(length / 2);
      expect(registrationInputSchema.parse({ email: "learner@example.com", password }).password).toBe(password);
    }
    const password = "🔐".repeat(PASSWORD_MAX_LENGTH / 2 + 1);
    expect(registrationInputSchema.safeParse({ email: "learner@example.com", password }).success).toBe(false);
  });

  it("only requires a nonempty password for existing credentials", () => {
    for (const password of ["x", " x ", "x".repeat(PASSWORD_MAX_LENGTH + 1)]) {
      expect(loginInputSchema.parse({ email: "learner@example.com", password }).password).toBe(password);
    }
    expect(loginInputSchema.safeParse({ email: "learner@example.com", password: "" }).success).toBe(false);
  });

  it.each([
    { email: "learner@example.com", password: "example-password", platformRole: "admin" },
    { email: "learner@example.com", password: "example-password", status: "active" },
    { email: "learner@example.com", password: "example-password", confirmPassword: "example-password" },
  ])("rejects fields outside the registration contract", (input) => {
    expect(registrationInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects missing, null, and incorrectly typed values", () => {
    for (const input of [null, {}, { email: 1 }, { email: null }]) {
      expect(emailInputSchema.safeParse(input).success).toBe(false);
    }
    expect(registrationInputSchema.safeParse({ email: "learner@example.com", password: 12345678 }).success).toBe(false);
    expect(resetPasswordInputSchema.safeParse({ token: "", password: "example-password" }).success).toBe(false);
  });
});
