import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "../../app/routes";
import { authClient, type PublicSession } from "../../lib/auth-client";
import { renderApp } from "../helpers/render-app";

const active: PublicSession = {
  userId: "user-1", name: "FANS user", email: "learner@example.com",
  platformRole: "user", status: "active", emailVerified: true,
};
const clients: QueryClient[] = [];
const routers: ReturnType<typeof createMemoryRouter>[] = [];
function mount(path: string, routes = appRoutes) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  routers.push(router);
  renderApp(<RouterProvider router={router} />, client);
  return router;
}
function withDeferredPage(lazy: () => Promise<{ Component: () => ReactElement }>): RouteObject[] {
  const root = appRoutes[0];
  return [{
    element: root.element,
    HydrateFallback: root.HydrateFallback,
    ErrorBoundary: root.ErrorBoundary,
    children: [{ path: "/deferred", lazy }],
  }];
}
beforeEach(() => { vi.spyOn(authClient, "getSession").mockResolvedValue(null); });
afterEach(() => {
  cleanup();
  for (const router of routers.splice(0)) router.dispose();
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe("lazy application routes", () => {
  it.each([
    { path: "/login", title: "Log in", session: null },
    { path: "/reset-password?token=example", title: "Reset password", session: null },
    { path: "/dashboard/settings", title: "Settings", session: active },
    { path: "/admin/orders/order-1", title: "Order record", session: { ...active, platformRole: "admin" } },
  ])("opens a direct URL to $path", async ({ path, title, session }) => {
    vi.mocked(authClient.getSession).mockResolvedValue(session);
    const router = mount(path);
    expect(await screen.findByRole("heading", { name: title, level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path.split("?")[0]);
  });

  it("shows the shared startup fallback while a deep-linked module is pending", async () => {
    let resolve!: (module: { Component: () => ReactElement }) => void;
    const pending = new Promise<{ Component: () => ReactElement }>((yes) => { resolve = yes; });
    mount("/deferred", withDeferredPage(() => pending));
    expect(screen.getByRole("status")).toHaveTextContent("Loading page…");
    expect(screen.queryByRole("heading", { name: "Deferred page" })).not.toBeInTheDocument();
    await act(async () => { resolve({ Component: () => <h1>Deferred page</h1> }); });
    expect(await screen.findByRole("heading", { name: "Deferred page" })).toBeInTheDocument();
    expect(screen.queryByText("Loading page…")).not.toBeInTheDocument();
  });

  it("offers reload and home recovery without displaying a failed import's details", async () => {
    mount("/deferred", withDeferredPage(async () => { throw new Error("private chunk URL and internal details"); }));
    expect(await screen.findByRole("heading", { name: "Unable to load this page", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Check your connection");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/private chunk URL/)).not.toBeInTheDocument();
  });
});
