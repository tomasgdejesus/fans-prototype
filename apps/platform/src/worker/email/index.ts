import type { EmailConfig } from "./config";
import type { SendEmail } from "./types";

export function createEmailSender(config: EmailConfig): SendEmail | null {
  if (config.provider === "disabled") return null;
  // Keep provider-specific dependencies behind the application contract.
  return async (message) => {
    const { createMailDevSender } = await import("./providers/maildev");
    await createMailDevSender(config)(message);
  };
}
