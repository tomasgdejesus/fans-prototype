import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequireAccount } from "../../../features/auth/components/require-account";
import { SessionSync } from "../../../features/auth/session-sync";
import { refreshPublicSession } from "../../../features/auth/session";
import { authClient, type PublicSession } from "../../../lib/auth-client";
import LoginPage from "../../../routes/login/page";
import { renderApp } from "../../helpers/render-app";

// Deliver to every other channel object, including those in the same tab.
// Tests control delivery so a notification can arrive during the login refresh.
class TestBroadcastChannel {
  static channels = new Set<TestBroadcastChannel>();
  static deliveries: (() => void)[] = [];
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;

  constructor(readonly name: string) {
    TestBroadcastChannel.channels.add(this);
  }

  postMessage(data: unknown) {
    for (const receiver of TestBroadcastChannel.channels) {
      if (receiver === this || receiver.name !== this.name) continue;
      TestBroadcastChannel.deliveries.push(() => {
        if (TestBroadcastChannel.channels.has(receiver)) receiver.onmessage?.(new MessageEvent("message", { data }));
      });
    }
  }

  close() {
    TestBroadcastChannel.channels.delete(this);
  }

  static deliver() {
    for (const callback of this.deliveries.splice(0)) callback();
  }
}

const active: PublicSession = { userId: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "user", status: "active", emailVerified: true };
const originalBroadcastChannel = globalThis.BroadcastChannel;
let client: QueryClient;

function renderLogin() {
  renderApp(
    <>
      <SessionSync />
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAccount />}>
            <Route path="/dashboard" element={<p>Authenticated dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </>,
    client,
  );
}

async function submitLogin() {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled());
  await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
  await user.type(screen.getByLabelText(/^Password/), "example-password");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.stubGlobal("BroadcastChannel", TestBroadcastChannel);
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
  vi.spyOn(authClient, "signIn").mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  client.clear();
  TestBroadcastChannel.channels.clear();
  TestBroadcastChannel.deliveries = [];
  vi.restoreAllMocks();
  vi.stubGlobal("BroadcastChannel", originalBroadcastChannel);
});

describe("session notifications during sign-in", () => {
  it("does not cancel login's session refresh in response to its own broadcast", async () => {
    let resolveSession!: (value: PublicSession) => void;
    const pendingSession = new Promise<PublicSession>((resolve) => { resolveSession = resolve; });
    vi.mocked(authClient.getSession).mockResolvedValueOnce(null).mockReturnValue(pendingSession);
    renderLogin();
    await submitLogin();
    await waitFor(() => expect(authClient.getSession).toHaveBeenCalledTimes(2));
    const signal = vi.mocked(authClient.getSession).mock.calls[1][0];

    await act(async () => { TestBroadcastChannel.deliver(); });
    expect(authClient.getSession).toHaveBeenCalledTimes(2);
    expect(signal?.aborted).toBe(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await act(async () => { resolveSession(active); });
    expect(await screen.findByText("Authenticated dashboard")).toBeInTheDocument();
  });

  it("still refreshes the session when another tab announces a change", async () => {
    renderLogin();
    await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled());
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    const otherTab = new TestBroadcastChannel("fans.auth");
    otherTab.postMessage({ type: "session-changed", source: "another-tab" });
    otherTab.close();

    await act(async () => { TestBroadcastChannel.deliver(); });
    expect(await screen.findByText("Authenticated dashboard")).toBeInTheDocument();
  });

  it("does not present a superseded session refresh as a login failure", async () => {
    let resolveSession!: (value: PublicSession) => void;
    const pendingSession = new Promise<PublicSession>((resolve) => { resolveSession = resolve; });
    vi.mocked(authClient.getSession).mockResolvedValueOnce(null).mockReturnValue(pendingSession);
    renderLogin();
    await submitLogin();
    await waitFor(() => expect(authClient.getSession).toHaveBeenCalledTimes(2));

    let replacement!: Promise<PublicSession | null>;
    await act(async () => {
      replacement = refreshPublicSession(client);
      await Promise.resolve();
    });
    await waitFor(() => expect(authClient.getSession).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await act(async () => { resolveSession(active); await replacement; });
    expect(await screen.findByText("Authenticated dashboard")).toBeInTheDocument();
  });

  it("still displays a rejected credential error", async () => {
    vi.mocked(authClient.signIn).mockResolvedValue({ ok: false, reason: "credentials" });
    renderLogin();
    await submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to log in with these details");
    expect(screen.queryByText("Authenticated dashboard")).not.toBeInTheDocument();
  });

  it("still displays a failure when a completed login refresh returns no session", async () => {
    renderLogin();
    await submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not complete that request. Please try again.");
    expect(screen.queryByText("Authenticated dashboard")).not.toBeInTheDocument();
  });

  it("still displays a real session-check failure after successful credential submission", async () => {
    vi.mocked(authClient.getSession).mockResolvedValueOnce(null).mockRejectedValue(new Error("Service unavailable"));
    renderLogin();
    await submitLogin();
    expect(await screen.findByText("We could not check your session. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Authenticated dashboard")).not.toBeInTheDocument();
  });
});
