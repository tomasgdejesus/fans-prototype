import { describe, expect, it, vi } from "vitest";
import { readEmailConfig } from "../email/config";
import { createEmailSender } from "../email";
import { deliverEmailTasks, sendAuthEmail, verificationPageURL } from "../email/auth";
import type { EmailTask } from "../email/types";

vi.mock("../email/templates/auth", () => ({
  renderAuthEmail: async (_kind: string, to: string, url: string) => ({ to, subject: "Auth email", text: url, html: `<a href="${url}">Continue</a>` }),
}));

const settings = { EMAIL_PROVIDER: "maildev", EMAIL_FROM: "FANS <noreply@fans.test>", SMTP_HOST: "127.0.0.1", SMTP_PORT: "1025" };

describe("email configuration", () => {
  it("disables mail without loading a transport when it is not configured", () => {
    expect(readEmailConfig()).toEqual({ provider: "disabled" });
    expect(createEmailSender(readEmailConfig())).toBeNull();
  });
  it("reads explicit MailDev configuration", () => {
    expect(readEmailConfig(settings)).toEqual({ provider: "maildev", from: settings.EMAIL_FROM, host: "127.0.0.1", port: 1025 });
  });
  it.each([
    { EMAIL_PROVIDER: "unknown" }, { EMAIL_FROM: "invalid" }, { EMAIL_FROM: "sender@fans.test\r\nBcc: other@fans.test" },
    { SMTP_HOST: "smtp://localhost" }, { SMTP_PORT: "0" }, { SMTP_PORT: "65536" }, { SMTP_PORT: "1.5" }, { SMTP_PORT: "" },
  ])("rejects invalid configuration without exposing supplied values", (override) => {
    expect(() => readEmailConfig({ ...settings, ...override })).toThrow(/EMAIL_PROVIDER|EMAIL_FROM, SMTP_HOST, and SMTP_PORT/);
  });
});

describe("auth email delivery", () => {
  it("defers rendering and sending until the request finishes", async () => {
    const tasks: EmailTask[] = [];
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendAuthEmail({ sendEmail, enqueue: (task) => { tasks.push(task); } }, "verification", "learner@fans.test", "http://localhost/verify-email?token=test");
    expect(sendEmail).not.toHaveBeenCalled();
    await deliverEmailTasks(tasks);
    expect(sendEmail).toHaveBeenCalledOnce();
  });
  it("registers deferred mail with the hosting lifetime handler", async () => {
    let complete!: () => void;
    const delivery = new Promise<void>((resolve) => { complete = resolve; });
    const waitUntil = vi.fn();
    await deliverEmailTasks([() => delivery], waitUntil);
    expect(waitUntil).toHaveBeenCalledOnce();
    complete();
    await waitUntil.mock.calls[0][0];
  });
  it("logs a failed delivery without leaking the message or token", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await deliverEmailTasks([async () => { throw new Error("private reset token"); }]);
      expect(log).toHaveBeenCalledExactlyOnceWith("Authentication email delivery failed.");
    } finally { log.mockRestore(); }
  });
  it("uses the existing verification page and preserves a same-origin destination", () => {
    const callback = "http://localhost:5173/verify-email?returnTo=%2Fcheckout";
    const page = new URL(verificationPageURL("http://localhost:5173", "token+value", `http://localhost:5173/api/auth/verify-email?callbackURL=${encodeURIComponent(callback)}`));
    expect(page.pathname).toBe("/verify-email");
    expect(page.searchParams.get("token")).toBe("token+value");
    expect(page.searchParams.get("returnTo")).toBe("/checkout");
  });
  it("does not adopt an external verification callback", () => {
    const page = new URL(verificationPageURL("http://localhost:5173", "test-token", "http://localhost:5173/api/auth/verify-email?callbackURL=https://untrusted.example/verify-email?returnTo=external"));
    expect(page.origin).toBe("http://localhost:5173");
    expect(page.searchParams.has("returnTo")).toBe(false);
  });
});
