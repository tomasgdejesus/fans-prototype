import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../constants/auth";

const requiredStringSchema = z.string({ error: "validation.required" })
  .min(1, { error: "validation.required" });

export const emailSchema = z.string({ error: "validation.required" }).trim()
  .min(1, { error: "validation.required" })
  .pipe(z.email({ error: "validation.invalidEmail" }));

// Match Better Auth's string.length checks, including UTF-16 surrogate pairs.
export const newPasswordSchema = requiredStringSchema.pipe(z.string()
  .refine((password) => password.length >= PASSWORD_MIN_LENGTH, { error: "validation.passwordTooShort" })
  .refine((password) => password.length <= PASSWORD_MAX_LENGTH, { error: "validation.passwordTooLong" }));

export const emailInputSchema = z.strictObject({ email: emailSchema });
export const displayNameInputSchema = z.strictObject({
  name: z.string({ error: "validation.required" }).trim()
    .min(1, { error: "validation.required" }).max(100, { error: "validation.nameTooLong" }),
});
export type DisplayNameInput = z.infer<typeof displayNameInputSchema>;
export const verificationStatusInputSchema = z.strictObject({ token: requiredStringSchema.max(8192) });
export type EmailVerificationStatus = "pending" | "verified" | "invalid";
export type EmailChangeStatus = "confirmation" | "verification" | "invalid";

// Existing credentials are not subject to the current new-password policy.
export const loginInputSchema = emailInputSchema.extend({ password: requiredStringSchema });
export const registrationInputSchema = emailInputSchema.extend({ password: newPasswordSchema });

// Application client input; the Better Auth adapter maps password to newPassword.
export const resetPasswordInputSchema = z.strictObject({
  token: requiredStringSchema,
  password: newPasswordSchema,
});

export type EmailInput = z.infer<typeof emailInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegistrationInput = z.infer<typeof registrationInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
