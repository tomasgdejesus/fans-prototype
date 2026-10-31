import type { RouteObject } from "react-router";
import AppLayout from "./layout";
import RouteLoading from "./route-loading";
import RouteError from "./route-error";
import { publicRoutes } from "./routes/public";
import { accountRoutes } from "./routes/account";
import { adminRoutes } from "./routes/admin";

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteError,
    children: [...publicRoutes, ...accountRoutes, ...adminRoutes],
  },
];
