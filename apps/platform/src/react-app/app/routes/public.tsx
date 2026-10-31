import type { RouteObject } from "react-router";
import { lazyPage } from "../lazy-page";
import AuthLayout from "../../routes/auth-layout";
import HomePage from "../../routes/page";
import NotFoundPage from "../../routes/not-found";
import PublicLayout from "../../routes/public-layout";
import CatalogPage from "../../routes/catalog/page";
import ProductPage from "../../routes/catalog/[productId]/page";
import VerifyPage from "../../routes/verify/[code]/page";
import SharedCertificatePage from "../../routes/shared/certificates/[token]/page";

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/catalog", element: <CatalogPage /> },
      { path: "/catalog/:productId", element: <ProductPage /> },
      {
        path: "/verify-email",
        lazy: lazyPage(() => import("../../routes/verify-email/page")),
      },
      {
        path: "/change-email",
        lazy: lazyPage(() => import("../../routes/change-email/page")),
      },
      { path: "/shared/certificates/:token", element: <SharedCertificatePage /> },
      { path: "/verify/:code", element: <VerifyPage /> },
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            lazy: lazyPage(() => import("../../routes/login/page")),
          },
          {
            path: "/register",
            lazy: lazyPage(() => import("../../routes/register/page")),
          },
          {
            path: "/forgot-password",
            lazy: lazyPage(() => import("../../routes/forgot-password/page")),
          },
          {
            path: "/reset-password",
            lazy: lazyPage(() => import("../../routes/reset-password/page")),
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
