import { beforeEach, describe, expect, it, vi } from "vitest";
import { verify } from "hono/jwt";
import { readEmailChangeStatus, readVerificationStatus } from "../auth/verification-status";

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


describe("read-only email-change status", () => {
  it.each([
    ["change-email-confirmation", "confirmation"],
    ["change-email-verification", "verification"],
  ] as const)("recognizes a signed %s token without mutating the account", async (requestType, status) => {
    vi.mocked(verify).mockResolvedValue({ ...claims, updateTo: "new@example.com", requestType });
    const find = vi.fn().mockResolvedValue({ emailVerified: true });
    expect(await readEmailChangeStatus("signed-token", "secret", find)).toBe(status);
    expect(find).toHaveBeenCalledExactlyOnceWith(claims.email);
  });

  it.each([
    claims, { ...claims, updateTo: "new@example.com" },
    { ...claims, requestType: "change-email-confirmation" },
    { ...claims, updateTo: "new@example.com", requestType: "unknown" },
  ])("rejects signup and incomplete tokens before querying an account", async (payload) => {
    vi.mocked(verify).mockResolvedValue(payload);
    const find = vi.fn();
    expect(await readEmailChangeStatus("signed-token", "secret", find)).toBe("invalid");
    expect(find).not.toHaveBeenCalled();
  });

  it.each([undefined, { emailVerified: false }])("rejects a missing or unverified source account", async (account) => {
    vi.mocked(verify).mockResolvedValue({ ...claims, updateTo: "new@example.com", requestType: "change-email-verification" });
    expect(await readEmailChangeStatus("signed-token", "secret", async () => account)).toBe("invalid");
  });

  it("rejects an expired or forged email-change token without querying an account", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("invalid signature"));
    const find = vi.fn();
    expect(await readEmailChangeStatus("forged", "secret", find)).toBe("invalid");
    expect(find).not.toHaveBeenCalled();
  });
});
