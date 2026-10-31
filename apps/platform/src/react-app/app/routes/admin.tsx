import type { RouteObject } from "react-router";
import { lazyPage } from "../lazy-page";
import { RequireAccount } from "../../features/auth/components/require-account";

export const adminRoutes: RouteObject[] = [
  {
    element: <RequireAccount allowedRoles={["admin"]} />,
    children: [
      {
        path: "/admin",
        lazy: lazyPage(() => import("../../routes/admin/layout")),
        children: [
          {
            index: true,
            lazy: lazyPage(() => import("../../routes/admin/page")),
          },
          {
            path: "learners",
            lazy: lazyPage(() => import("../../routes/admin/learners/page")),
          },
          {
            path: "learners/:learnerId",
            lazy: lazyPage(() => import("../../routes/admin/learners/[learnerId]/page")),
          },
          {
            path: "courses",
            lazy: lazyPage(() => import("../../routes/admin/courses/page")),
          },
          {
            path: "enrollments",
            lazy: lazyPage(() => import("../../routes/admin/enrollments/page")),
          },
          {
            path: "enrollments/:enrollmentId",
            lazy: lazyPage(() => import("../../routes/admin/enrollments/[enrollmentId]/page")),
          },
          {
            path: "certificates",
            lazy: lazyPage(() => import("../../routes/admin/certificates/page")),
          },
          {
            path: "certificates/:certificateId",
            lazy: lazyPage(() => import("../../routes/admin/certificates/[certificateId]/page")),
          },
          {
            path: "orders",
            lazy: lazyPage(() => import("../../routes/admin/orders/page")),
          },
          {
            path: "orders/:orderId",
            lazy: lazyPage(() => import("../../routes/admin/orders/[orderId]/page")),
          },
        ],
      },
    ],
  },
];
