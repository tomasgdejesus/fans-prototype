import type { RouteObject } from "react-router";
import { lazyPage } from "../lazy-page";
import { RequireAccount } from "../../features/auth/components/require-account";

export const accountRoutes: RouteObject[] = [
  {
    element: <RequireAccount />,
    children: [
      {
        path: "/dashboard",
        lazy: lazyPage(() => import("../../routes/dashboard/layout")),
        children: [
          {
            index: true,
            lazy: lazyPage(() => import("../../routes/dashboard/page")),
          },
          {
            path: "courses",
            lazy: lazyPage(() => import("../../routes/dashboard/courses/page")),
          },
          {
            path: "courses/:courseId",
            lazy: lazyPage(() => import("../../routes/dashboard/courses/[courseId]/page")),
          },
          {
            path: "enrollments",
            lazy: lazyPage(() => import("../../routes/dashboard/enrollments/page")),
          },
          {
            path: "enrollments/:enrollmentId",
            lazy: lazyPage(() => import("../../routes/dashboard/enrollments/[enrollmentId]/page")),
          },
          {
            path: "learners",
            lazy: lazyPage(() => import("../../routes/dashboard/learners/page")),
          },
          {
            path: "learners/:learnerId",
            lazy: lazyPage(() => import("../../routes/dashboard/learners/[learnerId]/page")),
          },
          {
            path: "orders",
            lazy: lazyPage(() => import("../../routes/dashboard/orders/page")),
          },
          {
            path: "orders/:orderId",
            lazy: lazyPage(() => import("../../routes/dashboard/orders/[orderId]/page")),
          },
          {
            path: "certificates",
            lazy: lazyPage(() => import("../../routes/dashboard/certificates/page")),
          },
          {
            path: "certificates/:certificateId",
            lazy: lazyPage(() => import("../../routes/dashboard/certificates/[certificateId]/page")),
          },
          {
            path: "settings",
            lazy: lazyPage(() => import("../../routes/dashboard/settings/page")),
          },
        ],
      },
      {
        path: "/checkout",
        lazy: lazyPage(() => import("../../routes/checkout/page")),
      },
      {
        path: "/checkout/return",
        lazy: lazyPage(() => import("../../routes/checkout/return/page")),
      },
    ],
  },
];
