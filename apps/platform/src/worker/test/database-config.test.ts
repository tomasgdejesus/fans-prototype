import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const files = vi.hoisted(() => ({ exists: vi.fn(), read: vi.fn() }));
vi.mock("node:fs", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:fs")>(),
  existsSync: files.exists,
  readFileSync: files.read,
}));

const runtime = "postgresql://app:app_password@pooler.example/test";
const direct = "postgresql://migration:migration_password@direct.example/test";

async function loadConfig() {
  return (await import("../../../drizzle.runtime.config")).default;
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("DATABASE_URL", runtime);
  vi.stubEnv("DATABASE_MIGRATION_URL", undefined);
  files.exists.mockReturnValue(false);
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("direct migration endpoint selection", () => {
  it("does not fall back to the application's pooled URL", async () => {
    await expect(loadConfig()).rejects.toThrow("Set DATABASE_MIGRATION_URL");
  });

  it("reads the direct URL from the existing .dev.vars file", async () => {
    files.exists.mockReturnValue(true);
    files.read.mockReturnValue(`DATABASE_URL=${runtime}\nDATABASE_MIGRATION_URL=${direct}\n`);
    expect(await loadConfig()).toMatchObject({ dbCredentials: { url: direct } });
    expect(files.read.mock.calls[0][0].pathname).toMatch(/\/\.dev\.vars$/);
  });

  it("gives an explicit migration environment value precedence over local vars", async () => {
    files.exists.mockReturnValue(true);
    files.read.mockReturnValue(`DATABASE_MIGRATION_URL=postgresql://local:local@localhost/test\n`);
    vi.stubEnv("DATABASE_MIGRATION_URL", direct);
    expect(await loadConfig()).toMatchObject({ dbCredentials: { url: direct } });
  });

  it("does not silently replace an explicitly empty migration environment value", async () => {
    files.exists.mockReturnValue(true);
    files.read.mockReturnValue(`DATABASE_MIGRATION_URL=${direct}\n`);
    vi.stubEnv("DATABASE_MIGRATION_URL", "");
    await expect(loadConfig()).rejects.toThrow("Set DATABASE_MIGRATION_URL");
  });

  it.each([
    "invalid://migration:secret_password@host/test",
    "not-a-url-secret_password",
    "postgresql://migration:secret_password@host/",
    "postgresql:///test",
  ])("rejects invalid migration targets without exposing credentials: %s", async (url) => {
    vi.stubEnv("DATABASE_MIGRATION_URL", url);
    const error = await loadConfig().catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("DATABASE_MIGRATION_URL");
    expect((error as Error).message).not.toContain("secret_password");
  });
});
