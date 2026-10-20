import { createBrowserRouter } from "react-router";
import AuthLayout from "../routes/auth-layout";
import ForgotPasswordPage from "../routes/forgot-password/page";
import HomePage from "../routes/page";
import LoginPage from "../routes/login/page";
import NotFoundPage from "../routes/not-found";
import RegisterPage from "../routes/register/page";
import ResetPasswordPage from "../routes/reset-password/page";
import DashboardLayout from "../routes/dashboard/layout";
import DashboardPage from "../routes/dashboard/page";
import CoursePage from "../routes/dashboard/courses/page";
import CourseDetailPage from "../routes/dashboard/courses/[courseId]/page";
import OrganizationsPage from "../routes/dashboard/organizations/page";
import OrganizationDetailPage from "../routes/dashboard/organizations/[organizationId]/page";
import OrdersPage from "../routes/dashboard/orders/page";
import SettingsPage from "../routes/dashboard/settings/page";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "courses", element: <CoursePage /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "organizations", element: <OrganizationsPage /> },
      {
        path: "organizations/:organizationId",
        element: <OrganizationDetailPage />,
      },
      { path: "orders", element: <OrdersPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
