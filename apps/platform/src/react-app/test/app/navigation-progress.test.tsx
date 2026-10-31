import { QueryClient, useQuery } from "@tanstack/react-query";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactElement } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "../../app/layout";
import { renderApp } from "../helpers/render-app";

const progress = vi.hoisted(() => ({ start: vi.fn(), complete: vi.fn() }));
vi.mock("@mantine/nprogress", () => ({
  nprogress: progress,
  NavigationProgress: () => <div data-testid="navigation-progress" />,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const clients: QueryClient[] = [];
const routers: ReturnType<typeof createMemoryRouter>[] = [];
function mount(routes: RouteObject[], client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  clients.push(client);
  const router = createMemoryRouter([{ element: <AppLayout />, children: routes }]);
  routers.push(router);
  const view = renderApp(<StrictMode><RouterProvider router={router} /></StrictMode>, client);
  return { ...view, router, client };
}
beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => {
  cleanup();
  for (const router of routers.splice(0)) router.dispose();
  for (const client of clients.splice(0)) client.clear();
});
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 200));

describe("shared navigation progress", () => {
  it("starts for a pending lazy route and completes after the destination loads", async () => {
    const pending = deferred<{ Component: () => ReactElement }>();
    const { router } = mount([
      { path: "/", element: <p>Home</p> },
      { path: "/next", lazy: () => pending.promise },
    ]);
    expect(screen.getAllByTestId("navigation-progress")).toHaveLength(1);
    expect(progress.start).not.toHaveBeenCalled();
    let navigation!: Promise<void>;
    await act(async () => { navigation = router.navigate("/next"); });
    await waitFor(() => expect(progress.start).toHaveBeenCalledOnce());
    expect(progress.complete).not.toHaveBeenCalled();
    await act(async () => { pending.resolve({ Component: () => <p>Destination</p> }); await navigation; });
    expect(await screen.findByText("Destination")).toBeInTheDocument();
    await waitFor(() => expect(progress.complete).toHaveBeenCalledOnce());
  });

  it("keeps progress active until all initial page requests settle, including errors", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    function Page() {
      const a = useQuery({ queryKey: ["first"], queryFn: () => first.promise });
      const b = useQuery({ queryKey: ["second"], queryFn: () => second.promise });
      return <><p>{a.data ?? "Loading first"}</p><p>{b.isError ? "Second failed" : "Loading second"}</p></>;
    }
    mount([{ path: "/", element: <Page /> }]);
    await waitFor(() => expect(progress.start).toHaveBeenCalledOnce());
    await act(async () => { first.resolve("First ready"); });
    expect(await screen.findByText("First ready")).toBeInTheDocument();
    expect(progress.complete).not.toHaveBeenCalled();
    await act(async () => { second.reject(new Error("Unavailable")); });
    expect(await screen.findByText("Second failed")).toBeInTheDocument();
    await waitFor(() => expect(progress.complete).toHaveBeenCalledOnce());
  });

  it("ignores cached-data refreshes and requests without mounted consumers", async () => {
    const refresh = deferred<string>();
    const preload = deferred<string>();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["existing"], "Cached data");
    function Page() {
      const query = useQuery({ queryKey: ["existing"], queryFn: () => refresh.promise });
      return <p>{query.isFetching ? "Refreshing cached data" : query.data}</p>;
    }
    mount([{ path: "/", element: <Page /> }], client);
    expect(await screen.findByText("Refreshing cached data")).toBeInTheDocument();
    let request!: Promise<string>;
    await act(async () => {
      request = client.fetchQuery({ queryKey: ["preload"], queryFn: () => preload.promise });
      await delay();
    });
    expect(progress.start).not.toHaveBeenCalled();
    expect(progress.complete).not.toHaveBeenCalled();
    await act(async () => { refresh.resolve("Fresh data"); preload.resolve("Preloaded"); await request; });
    expect(await screen.findByText("Fresh data")).toBeInTheDocument();
  });

  it("does not flash on instant page changes", async () => {
    const { router } = mount([
      { path: "/", element: <p>Home</p> },
      { path: "/next", element: <p>Instant destination</p> },
    ]);
    await act(async () => { await router.navigate("/next"); await delay(); });
    expect(screen.getByText("Instant destination")).toBeInTheDocument();
    expect(progress.start).not.toHaveBeenCalled();
    expect(progress.complete).not.toHaveBeenCalled();
  });

  it("completes active progress when the layout unmounts", async () => {
    const pending = deferred<null>();
    const { router, unmount } = mount([
      { path: "/", element: <p>Home</p> },
      { path: "/next", loader: () => pending.promise, element: <p>Destination</p> },
    ]);
    let navigation!: Promise<void>;
    await act(async () => { navigation = router.navigate("/next"); });
    await waitFor(() => expect(progress.start).toHaveBeenCalledOnce());
    unmount();
    expect(progress.complete).toHaveBeenCalledOnce();
    await act(async () => { pending.resolve(null); await navigation; });
  });
});
