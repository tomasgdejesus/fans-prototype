import { describe, expect, it, vi } from "vitest";
import app, { createApp } from "../app";
import type { Database, withDatabase } from "../db/client";

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

  it("reports unavailable database configuration without exposing details", async () => {
    const response = await app.request("/api/health/db");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });

  it("uses the injected database runner and waits for its scope to finish", async () => {
    const events: string[] = [];
    const execute = vi.fn(async () => { events.push("query"); });
    const database = { execute } as unknown as Database;
    const runDatabase: typeof withDatabase = async (url, run) => {
      expect(url).toBe("postgresql://test.invalid/test");
      events.push("open");
      try { return await run(database); }
      finally { events.push("release"); }
    };
    const response = await createApp(runDatabase).request("/api/health/db", {}, {
      DATABASE_URL: "postgresql://test.invalid/test",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(events).toEqual(["open", "query", "release"]);
  });

  it("reports injected database failures without exposing connection details", async () => {
    const runDatabase: typeof withDatabase = async () => {
      throw new Error("private connection details");
    };
    const response = await createApp(runDatabase).request("/api/health/db");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});
