import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { readEmailConfig } from "../../email/config";
import { createEmailSender } from "../../email";
import { renderAuthEmail } from "../../email/templates/auth";

describe("MailDev SMTP delivery", () => {
  it("captures rendered verification and recovery messages", async () => {
    const recipient = `mail-${randomUUID()}@fans.test`;
    const sender = createEmailSender(readEmailConfig({
      EMAIL_PROVIDER: "maildev", EMAIL_FROM: "FANS <noreply@fans.test>",
      SMTP_HOST: process.env.SMTP_HOST ?? "127.0.0.1", SMTP_PORT: process.env.SMTP_PORT ?? "1025",
    }))!;
    const inbox = process.env.MAILDEV_URL ?? "http://127.0.0.1:1080";
    for (const kind of ["verification", "passwordReset"] as const) {
      const message = await renderAuthEmail(kind, recipient, `http://localhost:5173/${kind}?token=test-token`);
      await sender(message);
    }
    type CapturedEmail = { id: string; to: { address: string }[]; html: string; text: string; subject: string };
    let captured: CapturedEmail[] = [];
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const response = await fetch(`${inbox}/api/email`);
      if (!response.ok) throw new Error("Could not read MailDev inbox.");
      const messages = await response.json() as CapturedEmail[];
      captured = messages.filter((message) => message.to.some((address) => address.address === recipient));
      if (captured.length === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(captured).toHaveLength(2);
    for (const message of captured) {
      expect(message.html).toContain("test-token");
      expect(message.text).toContain("test-token");
    }
    // Delete only this test's messages; other developers/tests may share the inbox.
    await Promise.all(captured.map((message) => fetch(`${inbox}/api/email/${message.id}`, { method: "DELETE" })));
  });
});
