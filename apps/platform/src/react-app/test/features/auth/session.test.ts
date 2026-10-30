import { CancelledError, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient, type PublicSession } from "../../../lib/auth-client";
import { clearPublicSession, publicSessionKey, publicSessionOptions, refreshPublicSession } from "../../../features/auth/session";

const account = (userId: string): PublicSession => ({ userId, platformRole: "user", status: "active", emailVerified: true });
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

describe("session cache", () => {
  it("clears cached account data and mutation results before publishing another account", async () => {
    client.setQueryData(publicSessionKey, account("old"));
    client.setQueryData(["orders"], ["old-private-order"]);
    const mutation = client.getMutationCache().build(client, { mutationFn: async () => "private-result" });
    await mutation.execute(undefined);
    vi.mocked(authClient.getSession).mockResolvedValue(account("new"));
    expect(await refreshPublicSession(client)).toEqual(account("new"));
    expect(client.getQueryData(["orders"])).toBeUndefined();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(client.getQueryData(publicSessionKey)).toEqual(account("new"));
  });

  it("clears account data when a session expires", async () => {
    client.setQueryData(publicSessionKey, account("old"));
    client.setQueryData(["orders"], ["private"]);
    expect(await refreshPublicSession(client)).toBeNull();
    expect(client.getQueryData(["orders"])).toBeUndefined();
  });

  it("retains the session on an outage and records an error", async () => {
    client.setQueryData(publicSessionKey, account("old"));
    vi.mocked(authClient.getSession).mockRejectedValue(new Error("Unavailable"));
    await expect(refreshPublicSession(client)).rejects.toThrow("Unavailable");
    expect(client.getQueryData(publicSessionKey)).toEqual(account("old"));
    expect(client.getQueryState(publicSessionKey)?.status).toBe("error");
  });

  it("prevents an obsolete session request from overwriting a new login", async () => {
    let resolveOld!: (value: PublicSession) => void;
    const oldResult = new Promise<PublicSession>((resolve) => { resolveOld = resolve; });
    vi.mocked(authClient.getSession).mockReturnValueOnce(oldResult).mockResolvedValue(account("new"));
    const obsolete = client.fetchQuery(publicSessionOptions(client)).catch(() => undefined);
    await refreshPublicSession(client);
    resolveOld(account("old"));
    await obsolete;
    expect(client.getQueryData(publicSessionKey)).toEqual(account("new"));
  });

  it.each([null, account("old")])("rejects a superseded refresh instead of returning cached data: %j", async (previous) => {
    client.setQueryData(publicSessionKey, previous);
    let resolveOld!: (value: PublicSession) => void;
    const oldResult = new Promise<PublicSession>((resolve) => { resolveOld = resolve; });
    vi.mocked(authClient.getSession).mockReturnValueOnce(oldResult).mockResolvedValue(account("new"));
    const obsolete = expect(refreshPublicSession(client)).rejects.toBeInstanceOf(CancelledError);
    await vi.waitFor(() => expect(authClient.getSession).toHaveBeenCalledOnce());

    expect(await refreshPublicSession(client)).toEqual(account("new"));
    await obsolete;
    resolveOld(account("old"));
    await oldResult;
    expect(client.getQueryData(publicSessionKey)).toEqual(account("new"));
  });

  it("cancels in-flight private queries and clears the cache after logout", async () => {
    let resolveOrder!: (value: string) => void;
    const order = client.fetchQuery({ queryKey: ["orders"], queryFn: () => new Promise<string>((resolve) => { resolveOrder = resolve; }) }).catch(() => undefined);
    client.setQueryData(publicSessionKey, account("old"));
    await clearPublicSession(client);
    resolveOrder("late private result");
    await order;
    expect(client.getQueryData(["orders"])).toBeUndefined();
    expect(client.getQueryData(publicSessionKey)).toBeNull();
  });
});
