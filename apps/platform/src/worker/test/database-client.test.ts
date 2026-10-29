import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withDatabase } from "../db/client";

const driver = vi.hoisted(() => ({
  created: vi.fn(), connect: vi.fn(), query: vi.fn(), end: vi.fn(),
}));

vi.mock("pg", async (importOriginal) => {
  const original = await importOriginal<typeof import("pg")>();
  const { EventEmitter } = await import("node:events");
  class TestClient extends EventEmitter {
    connect = driver.connect;
    query = driver.query;
    end = driver.end;
    constructor(config: unknown) {
      super();
      driver.created(config, this);
    }
  }
  return { ...original, Client: TestClient };
});

const url = "postgresql://unused:unused@localhost/unused";

beforeEach(() => {
  vi.resetAllMocks();
  driver.connect.mockResolvedValue(undefined);
  driver.query.mockResolvedValue({ rows: [] });
  driver.end.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

describe("request-owned PostgreSQL connection", () => {
  it("uses the supplied endpoint without untracked server startup parameters", async () => {
    await withDatabase(url, async () => undefined);
    const [config] = driver.created.mock.calls[0];
    expect(config.connectionString).toBe(url);
    expect(config).not.toHaveProperty("statement_timeout");
    expect(config).not.toHaveProperty("options");
  });

  it("connects before running work and awaits shutdown before returning", async () => {
    const events: string[] = [];
    let finishCleanup!: () => void;
    driver.connect.mockImplementation(async () => { events.push("connect"); });
    driver.end.mockImplementation(() => {
      events.push("end");
      return new Promise<void>((resolve) => { finishCleanup = resolve; });
    });
    let settled = false;
    const operation = withDatabase(url, async (db) => {
      events.push("work");
      await db.execute(sql`select 1`);
      return "result";
    }).then((value) => { settled = true; return value; });

    await vi.waitFor(() => expect(driver.end).toHaveBeenCalledOnce());
    expect(events).toEqual(["connect", "work", "end"]);
    expect(settled).toBe(false);
    finishCleanup();
    await expect(operation).resolves.toBe("result");
  });

  it("uses the same connection for Drizzle transaction statements", async () => {
    await withDatabase(url, (db) => db.transaction(async (tx) => {
      await tx.execute(sql`select 1`);
    }));
    expect(driver.created).toHaveBeenCalledOnce();
    expect(driver.query.mock.calls.map(([config]) => config.text)).toEqual(["begin", "select 1", "commit"]);
    expect(driver.end).toHaveBeenCalledOnce();
  });

  it("rolls back a failed transaction before closing the connection", async () => {
    const failure = new Error("Transaction failed");
    await expect(withDatabase(url, (db) => db.transaction(async () => {
      throw failure;
    }))).rejects.toBe(failure);
    expect(driver.query.mock.calls.map(([config]) => config.text)).toEqual(["begin", "rollback"]);
    expect(driver.end).toHaveBeenCalledOnce();
  });

  it("closes after a connection failure without executing the callback", async () => {
    const failure = new Error("Connect failed");
    driver.connect.mockRejectedValue(failure);
    const run = vi.fn();
    await expect(withDatabase(url, run)).rejects.toBe(failure);
    expect(run).not.toHaveBeenCalled();
    expect(driver.end).toHaveBeenCalledOnce();
  });

  it("does not conceal an underlying query failure", async () => {
    const failure = new Error("Query failed");
    driver.query.mockRejectedValue(failure);
    await expect(withDatabase(url, (db) => db.execute(sql`select 1`)))
      .rejects.toMatchObject({ cause: failure });
    expect(driver.end).toHaveBeenCalledOnce();
  });

  it("propagates cleanup failure after otherwise successful work", async () => {
    const failure = new Error("Cleanup failed");
    driver.end.mockRejectedValue(failure);
    await expect(withDatabase(url, async () => "result")).rejects.toBe(failure);
  });

  it("preserves the original failure when cleanup fails too", async () => {
    const failure = new Error("Original failure");
    driver.end.mockRejectedValue(new Error("Cleanup failed"));
    await expect(withDatabase(url, async () => { throw failure; })).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith("PostgreSQL connection cleanup failed.");
  });

  it.each(["work", "cleanup"])("keeps cancellation errors visible during %s", async (phase) => {
    const emitError = () => {
      const connection = driver.created.mock.calls[0][1];
      connection.emit("error", new Error("Stream was cancelled."));
    };
    if (phase === "cleanup") driver.end.mockImplementation(async () => { emitError(); });
    await withDatabase(url, async () => { if (phase === "work") emitError(); });
    expect(console.error).toHaveBeenCalledWith("PostgreSQL connection failed.", {
      name: "Error", code: undefined, message: "Stream was cancelled.",
    });
  });

  it("creates independent clients for separate requests", async () => {
    await withDatabase(url, async () => undefined);
    await withDatabase(url, async () => undefined);
    expect(driver.created).toHaveBeenCalledTimes(2);
    expect(driver.created.mock.calls[0][1]).not.toBe(driver.created.mock.calls[1][1]);
    expect(driver.end).toHaveBeenCalledTimes(2);
  });

  it("rejects missing configuration without creating a connection", async () => {
    await expect(withDatabase(undefined, async () => undefined)).rejects.toThrow("DATABASE_URL is not configured.");
    expect(driver.created).not.toHaveBeenCalled();
  });
});
