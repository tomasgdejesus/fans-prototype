import type { EmailConfig } from "../config";
import type { SendEmail } from "../types";

export function createMailDevSender(config: Extract<EmailConfig, { provider: "maildev" }>): SendEmail {
  return async (message) => {
    const { default: nodemailer } = await import("nodemailer");
    // No pooled sockets survive a Worker request. MailDev is an unencrypted local sink.
    const transport = nodemailer.createTransport({
      host: config.host, port: config.port, secure: false, ignoreTLS: true,
      name: "fans.local", pool: false,
      connectionTimeout: 5_000, greetingTimeout: 5_000, socketTimeout: 10_000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    try {
      const result = await transport.sendMail({ from: config.from, ...message });
      if (result.rejected.length > 0) throw new Error("Email recipient was rejected.");
    } finally {
      transport.close();
    }
  };
}
