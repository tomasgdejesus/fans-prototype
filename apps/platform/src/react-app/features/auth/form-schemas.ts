import { z } from "zod";
import { newPasswordSchema, registrationInputSchema } from "../../../shared/contracts/auth";

const confirmPasswordSchema = z.string({ error: "validation.required" })
  .min(1, { error: "validation.required" });

export const registrationFormSchema = registrationInputSchema.extend({
  confirmPassword: confirmPasswordSchema,
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  error: "validation.passwordMismatch",
});

export const resetPasswordFormSchema = z.strictObject({
  password: newPasswordSchema,
  confirmPassword: confirmPasswordSchema,
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  error: "validation.passwordMismatch",
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
