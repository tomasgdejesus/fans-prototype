import { describe, expect, it } from "vitest";
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from "../../shared/constants/auth";
import { renderAuthEmail } from "../email/templates/auth";

describe("authentication email templates", () => {
  it("includes the configured verification lifetime in HTML and plain text", async () => {
    const url = "http://localhost:5173/verify-email?token=test-token";
    const message = await renderAuthEmail("verification", "learner@fans.test", url);
    const expiry = `Verification link will expire in ${EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 60} minutes.`;
    expect(message.html).toContain(expiry);
    expect(message.text).toContain(expiry);
    expect(message.html).toContain(url);
  });

  it("welcomes a verified user with a normal login link", async () => {
    const message = await renderAuthEmail("welcome", "learner@fans.test", "http://localhost:5173/login");
    expect(message.subject).toBe("Welcome to FANS");
    for (const content of [message.html, message.text]) {
      expect(content).toContain("Your email address has been verified.");
      expect(content).toContain("http://localhost:5173/login");
      expect(content).not.toContain("token=");
      expect(content).not.toContain("will expire");
    }
  });
});


describe("email-change templates", () => {
  it("identifies the requested new address in the current-inbox approval email", async () => {
    const url = "http://localhost:5173/change-email?token=approval-token";
    const message = await renderAuthEmail("emailChangeConfirmation", "old@example.com", url, "new@example.com");
    expect(message.subject).toBe("Approve your FANS email change");
    for (const content of [message.html, message.text]) {
      expect(content).toContain("new@example.com");
      expect(content).toContain(url);
      expect(content).toContain("until the new address is verified");
    }
  });
  it("uses a separate verification message for the new inbox", async () => {
    const message = await renderAuthEmail("emailChangeVerification", "new@example.com", "http://localhost:5173/change-email?token=verification-token");
    expect(message.subject).toBe("Verify your new FANS email address");
    expect(message.text).toContain("complete your FANS account email change");
    expect(message.text).not.toContain("Welcome to FANS");
  });
});
