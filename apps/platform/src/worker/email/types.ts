export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendEmail = (message: EmailMessage) => Promise<void>;
export type EmailTask = () => Promise<void>;
export type AuthEmailKind = "verification" | "passwordReset" | "welcome" | "emailChangeConfirmation" | "emailChangeVerification";
