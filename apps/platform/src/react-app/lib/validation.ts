import type { TFunction } from "i18next";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../shared/constants/auth";

// Translate on render so visible errors follow language changes.
export function validationMessage(message: string | undefined, t: TFunction): string | undefined {
  if (!message) return undefined;
  switch (message) {
    case "validation.nameTooLong":
    case "validation.emailUnchanged":
    case "validation.required":
    case "validation.invalidEmail":
    case "validation.passwordTooShort":
    case "validation.passwordTooLong":
    case "validation.passwordMismatch":
      return t(message, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
    default:
      return t("validation.invalid");
  }
}
