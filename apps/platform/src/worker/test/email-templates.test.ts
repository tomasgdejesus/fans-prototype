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
