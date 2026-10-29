import { CancelledError, queryOptions, type QueryClient } from "@tanstack/react-query";
import { authClient, type PublicSession } from "../../lib/auth-client";

export const publicSessionKey = ["auth", "session"] as const;
// Identifies the sending tab; this is not a session token or authorization input.
const sessionBroadcastSource = crypto.randomUUID();
const accountQueries = { predicate: (query: { queryKey: readonly unknown[] }) =>
  !(query.queryKey.length === 2 && query.queryKey[0] === "auth" && query.queryKey[1] === "session") };

async function clearAccountCache(queryClient: QueryClient) {
  // Discard all other queries, including in-flight requests, before exposing a
  // different account. Future public-only caches can be exempted explicitly.
  await queryClient.cancelQueries(accountQueries);
  queryClient.removeQueries(accountQueries);
  queryClient.getMutationCache().clear();
}

async function readPublicSession(queryClient: QueryClient, signal: AbortSignal) {
  const next = await authClient.getSession(signal);
  signal.throwIfAborted();
  const previous = queryClient.getQueryData<PublicSession | null>(publicSessionKey);
  if (previous?.userId !== next?.userId || previous?.status !== next?.status
    || previous?.platformRole !== next?.platformRole) await clearAccountCache(queryClient);
  signal.throwIfAborted();
  return next;
}

export function publicSessionOptions(queryClient: QueryClient) {
  return queryOptions({
    queryKey: publicSessionKey,
    queryFn: ({ signal }) => readPublicSession(queryClient, signal),
    enabled: authClient.configured,
    retry: false,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 60_000,
  });
}

export async function refreshPublicSession(queryClient: QueryClient) {
  // Prevent a request started before login from overwriting the new session.
  await queryClient.cancelQueries({ queryKey: publicSessionKey, exact: true });
  const request: { signal?: AbortSignal } = {};
  const next = await queryClient.fetchQuery({
    ...publicSessionOptions(queryClient),
    staleTime: 0,
    queryFn: ({ signal }) => {
      request.signal = signal;
      return readPublicSession(queryClient, signal);
    },
  });
  // A cancelled fetch can resolve with reverted cache data, including null.
  // Never present that old value as the result of this refresh.
  if (request.signal?.aborted) throw new CancelledError();
  return next;
}

export async function clearPublicSession(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: publicSessionKey, exact: true });
  await clearAccountCache(queryClient);
  queryClient.setQueryData(publicSessionKey, null);
}

export function openSessionChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("fans.auth");
  } catch {
    // Restricted browser contexts can deny this API. Focus/polling still refresh.
    return null;
  }
}

export function isExternalSessionChange(data: unknown): boolean {
  return typeof data === "object" && data !== null
    && "type" in data && data.type === "session-changed"
    && "source" in data && typeof data.source === "string"
    && data.source !== sessionBroadcastSource;
}

export function broadcastSessionChange() {
  const channel = openSessionChannel();
  if (!channel) return;
  try { channel.postMessage({ type: "session-changed", source: sessionBroadcastSource }); }
  catch { /* Cross-tab notifications are best effort. */ }
  finally { channel.close(); }
}
