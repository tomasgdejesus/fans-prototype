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
import OrdersPage from "../routes/dashboard/orders/page";
import SettingsPage from "../routes/dashboard/settings/page";
import PublicLayout from "../routes/public-layout";
import CatalogPage from "../routes/catalog/page";
import ProductPage from "../routes/catalog/[productId]/page";
import VerifyEmailPage from "../routes/verify-email/page";
import VerifyPage from "../routes/verify/[code]/page";
import SharedCertificatePage from "../routes/shared/certificates/[token]/page";
import EnrollmentsPage from "../routes/dashboard/enrollments/page";
import EnrollmentPage from "../routes/dashboard/enrollments/[enrollmentId]/page";
import LearnersPage from "../routes/dashboard/learners/page";
import LearnerPage from "../routes/dashboard/learners/[learnerId]/page";
import OrderPage from "../routes/dashboard/orders/[orderId]/page";
import CertificatesPage from "../routes/dashboard/certificates/page";
import CertificatePage from "../routes/dashboard/certificates/[certificateId]/page";
import CheckoutPage from "../routes/checkout/page";
import CheckoutReturnPage from "../routes/checkout/return/page";
import AdminLayout from "../routes/admin/layout";
import AdminHomePage from "../routes/admin/page";
import AdminLearnersPage from "../routes/admin/learners/page";
import AdminLearnerPage from "../routes/admin/learners/[learnerId]/page";
import AdminCoursesPage from "../routes/admin/courses/page";
import AdminEnrollmentsPage from "../routes/admin/enrollments/page";
import AdminEnrollmentPage from "../routes/admin/enrollments/[enrollmentId]/page";
import AdminCertificatesPage from "../routes/admin/certificates/page";
import AdminCertificatePage from "../routes/admin/certificates/[certificateId]/page";
import AdminOrdersPage from "../routes/admin/orders/page";
import AdminOrderPage from "../routes/admin/orders/[orderId]/page";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/catalog", element: <CatalogPage /> },
      { path: "/catalog/:productId", element: <ProductPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/shared/certificates/:token", element: <SharedCertificatePage /> },
      { path: "/verify/:code", element: <VerifyPage /> },
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/register", element: <RegisterPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "courses", element: <CoursePage /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "enrollments", element: <EnrollmentsPage /> },
      { path: "enrollments/:enrollmentId", element: <EnrollmentPage /> },
      { path: "learners", element: <LearnersPage /> },
      { path: "learners/:learnerId", element: <LearnerPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:orderId", element: <OrderPage /> },
      { path: "certificates", element: <CertificatesPage /> },
      { path: "certificates/:certificateId", element: <CertificatePage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/checkout/return", element: <CheckoutReturnPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminHomePage /> },
      { path: "learners", element: <AdminLearnersPage /> },
      { path: "learners/:learnerId", element: <AdminLearnerPage /> },
      { path: "courses", element: <AdminCoursesPage /> },
      { path: "enrollments", element: <AdminEnrollmentsPage /> },
      { path: "enrollments/:enrollmentId", element: <AdminEnrollmentPage /> },
      { path: "certificates", element: <AdminCertificatesPage /> },
      { path: "certificates/:certificateId", element: <AdminCertificatePage /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "orders/:orderId", element: <AdminOrderPage /> },
    ],
  },
]);
