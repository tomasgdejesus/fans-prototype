import { QueryClient } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "../../app/routes";
import { publicSessionKey } from "../../features/auth/session";
import { authClient, type PublicSession } from "../../lib/auth-client";
import { renderApp } from "../helpers/render-app";

const active: PublicSession = { userId: "user-1", platformRole: "user", status: "active", emailVerified: false };
const clients: QueryClient[] = [];
function renderRoute(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  renderApp(<RouterProvider router={router} />, client);
  return { router, client };
}

beforeEach(() => {
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
  vi.spyOn(authClient, "signOut").mockResolvedValue({ ok: true });
});
afterEach(() => { for (const client of clients.splice(0)) client.clear(); vi.restoreAllMocks(); });

describe("application route guards", () => {
  it.each([
    "/dashboard/orders/order-1?view=receipt#total", "/checkout?productId=servsafe-class",
    "/checkout/return?order=order-1", "/admin/orders/order-1",
  ])("preserves the destination when redirecting a signed-out visitor: %s", async (path) => {
    const { router } = renderRoute(path);
    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(new URLSearchParams(router.state.location.search).get("returnTo")).toBe(path);
    expect(screen.queryByRole("navigation", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Administration" })).not.toBeInTheDocument();
  });

  it("hides protected content while the initial session check is pending", async () => {
    let resolveSession!: (value: PublicSession | null) => void;
    vi.mocked(authClient.getSession).mockReturnValue(new Promise((resolve) => { resolveSession = resolve; }));
    renderRoute("/dashboard/orders/order-1");
    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
    expect(screen.queryByRole("heading", { name: "Order details" })).not.toBeInTheDocument();
    await act(async () => { resolveSession(active); });
    expect(await screen.findByRole("heading", { name: "Order details" })).toBeInTheDocument();
  });

  it.each([
    ["/dashboard/orders/order-1", "Order details"],
    ["/checkout", "Checkout"], ["/checkout/return", "Payment status"],
  ])("allows an active account into %s", async (path, title) => {
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    renderRoute(path);
    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
  });

  it.each(["suspended", "archived"])("blocks an inactive account: %s", async (status) => {
    vi.mocked(authClient.getSession).mockResolvedValue({ ...active, status });
    renderRoute("/checkout");
    expect(await screen.findByRole("heading", { name: "Account unavailable" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Checkout" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });

  it.each(["user", "staff", "unknown"])("denies admin access to role %s", async (platformRole) => {
    vi.mocked(authClient.getSession).mockResolvedValue({ ...active, platformRole });
    renderRoute("/admin/orders/order-1");
    expect(await screen.findByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Order record" })).not.toBeInTheDocument();
  });

  it("allows an admin and rejects an inactive admin", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({ ...active, platformRole: "admin" });
    const { client } = renderRoute("/admin/orders/order-1");
    expect(await screen.findByRole("heading", { name: "Order record" })).toBeInTheDocument();
    vi.mocked(authClient.getSession).mockResolvedValue({ ...active, platformRole: "admin", status: "suspended" });
    await act(async () => { await client.invalidateQueries({ queryKey: publicSessionKey }); });
    expect(await screen.findByRole("heading", { name: "Account unavailable" })).toBeInTheDocument();
  });

  it("shows an outage with retry, without redirecting or rendering protected content", async () => {
    vi.mocked(authClient.getSession).mockRejectedValue(new Error("Unavailable"));
    const { router } = renderRoute("/dashboard/orders/order-1");
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not check your session");
    expect(router.state.location.pathname).toBe("/dashboard/orders/order-1");
    expect(screen.queryByRole("heading", { name: "Order details" })).not.toBeInTheDocument();
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Order details" })).toBeInTheDocument();
  });

  it("redirects after session expiry and clears private queries", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    const { client } = renderRoute("/dashboard/orders/order-1");
    await screen.findByRole("heading", { name: "Order details" });
    client.setQueryData(["orders"], ["private"]);
    vi.mocked(authClient.getSession).mockResolvedValue(null);
    await act(async () => { await client.invalidateQueries({ queryKey: publicSessionKey }); });
    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(client.getQueryData(["orders"])).toBeUndefined();
  });

  it("logs out, clears private state, and returns to login", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    const { router, client } = renderRoute("/dashboard");
    await screen.findByRole("heading", { name: "Overview" });
    client.setQueryData(["orders"], ["private"]);
    vi.mocked(authClient.getSession).mockResolvedValue(null);
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(authClient.signOut).toHaveBeenCalledOnce();
    expect(client.getQueryData(["orders"])).toBeUndefined();
    expect(client.getQueryData(publicSessionKey)).toBeNull();
  });

  it("keeps the current account when logout fails", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(active);
    vi.mocked(authClient.signOut).mockResolvedValue({ ok: false, reason: "unavailable" });
    const { router, client } = renderRoute("/dashboard");
    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Account services are currently unavailable");
    expect(router.state.location.pathname).toBe("/dashboard");
    expect(client.getQueryData(publicSessionKey)).toEqual(active);
  });

  it("keeps catalog browsing public even during an authentication outage", async () => {
    vi.mocked(authClient.getSession).mockRejectedValue(new Error("Unavailable"));
    renderRoute("/catalog");
    expect(screen.getByRole("heading", { name: "Product catalog" })).toBeInTheDocument();
  });
});
