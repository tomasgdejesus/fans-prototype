import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withDatabase, type Database } from "../db/client";
import { withTestDatabase } from "./helpers/database";

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

describe("PostgreSQL connection ownership", () => {
  it("uses the supplied endpoint without untracked server startup parameters", async () => {
    await withDatabase(url, async () => undefined);
    const [config] = driver.created.mock.calls[0];
    expect(config.connectionString).toBe(url);
    expect(config).not.toHaveProperty("statement_timeout");
    expect(config).not.toHaveProperty("options");
  });

  it("awaits the Worker callback before returning and leaves cleanup to the invocation", async () => {
    let finishWork!: () => void;
    const work = new Promise<void>((resolve) => { finishWork = resolve; });
    const run = vi.fn(async () => { await work; return "result"; });
    let settled = false;
    const operation = withDatabase(url, run).then((value) => {
      settled = true;
      return value;
    });
    await vi.waitFor(() => expect(run).toHaveBeenCalledOnce());
    expect(driver.connect).toHaveBeenCalledOnce();
    expect(settled).toBe(false);
    finishWork();
    await expect(operation).resolves.toBe("result");
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("awaits explicit Node test cleanup before returning", async () => {
    const events: string[] = [];
    let finishCleanup!: () => void;
    driver.connect.mockImplementation(async () => { events.push("connect"); });
    driver.end.mockImplementation(() => {
      events.push("end");
      return new Promise<void>((resolve) => { finishCleanup = resolve; });
    });
    let settled = false;
    const operation = withTestDatabase(url, async (db) => {
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

  it("keeps Worker transaction statements on one connection without explicit shutdown", async () => {
    await withDatabase(url, (db) => db.transaction(async (tx) => {
      await tx.execute(sql`select 1`);
    }));
    expect(driver.created).toHaveBeenCalledOnce();
    expect(driver.query.mock.calls.map(([config]) => config.text)).toEqual(["begin", "select 1", "commit"]);
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("rolls back a failed Worker transaction without explicit shutdown", async () => {
    const failure = new Error("Transaction failed");
    await expect(withDatabase(url, (db) => db.transaction(async () => {
      throw failure;
    }))).rejects.toBe(failure);
    expect(driver.query.mock.calls.map(([config]) => config.text)).toEqual(["begin", "rollback"]);
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("propagates a Worker connection failure without executing the callback", async () => {
    const failure = new Error("Connect failed");
    driver.connect.mockRejectedValue(failure);
    const run = vi.fn();
    await expect(withDatabase(url, run)).rejects.toBe(failure);
    expect(run).not.toHaveBeenCalled();
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("does not conceal an underlying query failure", async () => {
    const failure = new Error("Query failed");
    driver.query.mockRejectedValue(failure);
    await expect(withDatabase(url, (db) => db.execute(sql`select 1`)))
      .rejects.toMatchObject({ cause: failure });
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("preserves a Worker callback failure without explicitly closing the client", async () => {
    const failure = new Error("Callback failed");
    await expect(withDatabase(url, async () => { throw failure; })).rejects.toBe(failure);
    expect(driver.end).not.toHaveBeenCalled();
  });

  it.each(["connect", "query", "callback"])("closes a Node test client after a %s failure", async (phase) => {
    const failure = new Error("Operation failed");
    if (phase === "connect") driver.connect.mockRejectedValue(failure);
    if (phase === "query") driver.query.mockRejectedValue(failure);
    const run = vi.fn(async (db: Database) => {
      if (phase === "callback") throw failure;
      await db.execute(sql`select 1`);
    });
    const operation = withTestDatabase(url, run);
    if (phase === "query") await expect(operation).rejects.toMatchObject({ cause: failure });
    else await expect(operation).rejects.toBe(failure);
    if (phase === "connect") expect(run).not.toHaveBeenCalled();
    expect(driver.end).toHaveBeenCalledOnce();
  });

  it("propagates cleanup failure after otherwise successful work", async () => {
    const failure = new Error("Cleanup failed");
    driver.end.mockRejectedValue(failure);
    await expect(withTestDatabase(url, async () => "result")).rejects.toBe(failure);
  });

  it("preserves the original failure when cleanup fails too", async () => {
    const failure = new Error("Original failure");
    driver.end.mockRejectedValue(new Error("Cleanup failed"));
    await expect(withTestDatabase(url, async () => { throw failure; })).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith("PostgreSQL test connection cleanup failed.");
  });

  it.each(["work", "cleanup"])("keeps cancellation errors visible during %s", async (phase) => {
    const emitError = () => {
      const connection = driver.created.mock.calls[0][1];
      connection.emit("error", new Error("Stream was cancelled."));
    };
    if (phase === "cleanup") driver.end.mockImplementation(async () => { emitError(); });
    const runDatabase = phase === "cleanup" ? withTestDatabase : withDatabase;
    await runDatabase(url, async () => { if (phase === "work") emitError(); });
    expect(console.error).toHaveBeenCalledWith("PostgreSQL connection failed.", {
      name: "Error", code: undefined, message: "Stream was cancelled.",
    });
  });

  it("keeps late Worker connection errors observable after the callback returns", async () => {
    await withDatabase(url, async () => "result");
    driver.created.mock.calls[0][1].emit("error", new Error("Stream was cancelled."));
    expect(console.error).toHaveBeenCalledWith("PostgreSQL connection failed.", {
      name: "Error", code: undefined, message: "Stream was cancelled.",
    });
  });

  it("creates independent clients for separate requests", async () => {
    await withDatabase(url, async () => undefined);
    await withDatabase(url, async () => undefined);
    expect(driver.created).toHaveBeenCalledTimes(2);
    expect(driver.created.mock.calls[0][1]).not.toBe(driver.created.mock.calls[1][1]);
    expect(driver.end).not.toHaveBeenCalled();
  });

  it("rejects missing configuration without creating a connection", async () => {
    await expect(withDatabase(undefined, async () => undefined)).rejects.toThrow("DATABASE_URL is not configured.");
    expect(driver.created).not.toHaveBeenCalled();
  });
});
