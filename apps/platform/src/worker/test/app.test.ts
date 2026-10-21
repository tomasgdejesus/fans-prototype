import { describe, expect, it } from "vitest";
import app from "../app";

describe("platform API", () => {
  it("returns the health status", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns a JSON response for unknown routes", async () => {
    const response = await app.request("/api/unknown");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
