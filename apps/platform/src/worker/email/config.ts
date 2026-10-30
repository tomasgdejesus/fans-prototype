import { z } from "zod";

export interface EmailBindings {
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
}

export type EmailConfig = { provider: "disabled" } | {
  provider: "maildev";
  from: string;
  host: string;
  port: number;
};

const maildevSchema = z.object({
  from: z.string().trim().min(1).max(254).refine((value) => {
    if (/[\r\n]/.test(value)) return false;
    const address = value.match(/^[^<>]*<([^<>]+)>$/)?.[1] ?? value;
    return z.email().safeParse(address).success;
  }),
  host: z.string().trim().min(1).refine((value) => !/[\s/:]/.test(value)),
  port: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
});

export function readEmailConfig(values: EmailBindings = {}): EmailConfig {
  const provider = values.EMAIL_PROVIDER ?? "disabled";
  if (provider === "disabled") return { provider };
  if (provider !== "maildev") throw new Error("EMAIL_PROVIDER must be disabled or maildev.");
  const parsed = maildevSchema.safeParse({
    from: values.EMAIL_FROM,
    host: values.SMTP_HOST,
    port: values.SMTP_PORT,
  });
  if (!parsed.success) throw new Error("MailDev requires a valid EMAIL_FROM, SMTP_HOST, and SMTP_PORT.");
  return { provider, ...parsed.data };
}
