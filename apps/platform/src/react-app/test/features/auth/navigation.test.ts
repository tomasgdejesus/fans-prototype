import { describe, expect, it } from "vitest";
import { accountPath, allowedDestination } from "../../../features/auth/navigation";

describe("account navigation", () => {
  it.each([
    null, "", "https://example.com", "//example.com", "/\\example.com",
    "/%2f%2fexample.com", "/dashboard/../../admin", "/api/health", "/login",
    "javascript:alert(1)", "/dashboard%0a", "/%invalid", "/admin/../checkout", "/dashboard/%2e%2e/admin",
  ])("rejects an unapproved destination: %s", (destination) => {
    expect(allowedDestination(destination)).toBe("/dashboard");
  });

  it.each(["/dashboard", "/dashboard/orders/abc", "/catalog", "/catalog/servsafe-class", "/checkout?productId=servsafe-class", "/checkout/return?order=abc#status", "/admin", "/admin/orders/abc"])("preserves an approved destination: %s", (destination) => {
    expect(allowedDestination(destination)).toBe(destination);
  });

  it("preserves the intended purchase when switching account pages", () => {
    const destination = "/checkout?productId=servsafe-class";
    const path = accountPath("/register", destination);
    expect(new URL(path, "https://fans.invalid").searchParams.get("returnTo")).toBe(destination);
    expect(accountPath("/login", "/dashboard")).toBe("/login");
  });
});
