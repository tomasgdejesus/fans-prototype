import { beforeEach, describe, expect, it, vi } from "vitest";
import { verify } from "hono/jwt";
import { readVerificationStatus } from "../auth/verification-status";

vi.mock("hono/jwt", () => ({ verify: vi.fn() }));
const claims = { email: "learner@example.com", exp: 2_000_000_000 };
beforeEach(() => { vi.mocked(verify).mockReset(); });

describe("read-only verification status", () => {
  it.each([false, true])("reads the account's verified state: %s", async (emailVerified) => {
    vi.mocked(verify).mockResolvedValue(claims);
    const find = vi.fn().mockResolvedValue({ emailVerified });
    expect(await readVerificationStatus("signed-token", "secret", find)).toBe(emailVerified ? "verified" : "pending");
    expect(verify).toHaveBeenCalledExactlyOnceWith("signed-token", "secret", "HS256");
    expect(find).toHaveBeenCalledExactlyOnceWith(claims.email);
  });

  it("does not query an account for an expired or tampered token", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("invalid signature or expired token"));
    const find = vi.fn();
    expect(await readVerificationStatus("invalid-token", "secret", find)).toBe("invalid");
    expect(find).not.toHaveBeenCalled();
  });

  it.each([
    { email: claims.email }, { exp: claims.exp }, { ...claims, exp: 0 }, { ...claims, email: "invalid" },
    { ...claims, updateTo: "other@example.com" }, { ...claims, requestType: "change-email-confirmation" },
  ])("rejects missing or unrelated token claims: %o", async (payload) => {
    vi.mocked(verify).mockResolvedValue(payload);
    const find = vi.fn();
    expect(await readVerificationStatus("signed-token", "secret", find)).toBe("invalid");
    expect(find).not.toHaveBeenCalled();
  });

  it("treats a deleted account as an invalid link", async () => {
    vi.mocked(verify).mockResolvedValue(claims);
    expect(await readVerificationStatus("signed-token", "secret", async () => undefined)).toBe("invalid");
  });

  it("preserves lookup failures as service failures", async () => {
    vi.mocked(verify).mockResolvedValue(claims);
    await expect(readVerificationStatus("signed-token", "secret", async () => { throw new Error("database unavailable"); }))
      .rejects.toThrow("database unavailable");
  });
});
