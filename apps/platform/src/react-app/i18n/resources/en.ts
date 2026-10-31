import { publicPages } from "./public-en";

export const en = {
  publicPages,
  validation: {
    required: "This field is required.",
    invalid: "Enter a valid value.",
    nameTooLong: "Use no more than 100 characters.",
    emailUnchanged: "Enter a different email address.",
    invalidEmail: "Enter a valid email address.",
    passwordTooShort: "Use at least {{min}} characters.",
    passwordTooLong: "Use no more than {{max}} characters.",
    passwordMismatch: "Passwords must match.",
  },
  common: {
    brand: "FANS",
    language: {
      label: "Language",
      english: "English",
      spanish: "Español",
    },
    actions: {
      logIn: "Log in",
      dashboard: "Dashboard",
      returnHome: "Return home",
      backToLogIn: "Back to log in",
      backToCourses: "Back to courses",
      backToOrganizations: "Back to organizations",
    },
    navigation: {
      main: "Main",
      loading: "Loading page…",
    },
    placeholder: {
      comingSoon: "Coming soon",
      beingBuilt: "This section is being built.",
    },
  },
  home: {
    tagline: "Food safety training and certificate management.",
    serviceStatus: "Service status",
    apiStatus: "API: {{status}}",
    status: {
      checking: "checking",
      unavailable: "unavailable",
      available: "available",
    },
    healthCheckError: "API health check failed",
  },
  auth: {
    login: {
      title: "Log in",
      description: "Sign in to access your training and account.",
      createAccount: "Create an account",
      forgotPassword: "Forgot your password?",
    },
    register: {
      title: "Create an account",
      description: "Get started with FANS training.",
      existingAccount: "Already have an account? Log in",
    },
    forgotPassword: {
      title: "Forgot password",
      description: "Request help resetting your password.",
    },
    resetPassword: {
      title: "Reset password",
      description: "Choose a new password for your account.",
    },
  },
  errors: {
    route: {
      title: "Unable to load this page",
      description: "Check your connection, then reload the page or return home.",
      reload: "Reload page",
    },
    notFound: {
      title: "Page not found",
      description: "The page you requested could not be found.",
    },
  },
  dashboard: {
    navigation: {
      label: "Dashboard",
      open: "Open navigation",
      close: "Close navigation",
      overview: "Overview",
      courses: "Courses",
      enrollments: "Enrollments",
      learners: "Learners",
      orders: "Orders",
      certificates: "Certificates",
      settings: "Settings",
    },
    tagline: "Food safety training and certificates",
    overview: {
      title: "Overview",
      description: "Your training and account, in one place.",
      sections: {
        courses: {
          title: "Courses",
          description: "Access training and follow your learning progress.",
          action: "View courses",
        },
        organizations: {
          title: "Organizations",
          description: "Manage your organizations and employee training.",
          action: "View organizations",
        },
        orders: {
          title: "Orders",
          description: "Review purchases and order details.",
          action: "View orders",
        },
      },
    },
    courses: {
      title: "Courses",
      description: "Access training and follow your learning progress.",
      detailTitle: "Course details",
      detailDescription: "View course content, requirements, and progress.",
    },
    organizations: {
      title: "Organizations",
      description: "Manage organizations, employees, and training assignments.",
      detailTitle: "Organization details",
      detailDescription: "View employees and manage their training assignments.",
    },
    orders: {
      title: "Orders",
      description: "Review purchases, order details, and receipts.",
    },
    settings: {
      title: "Settings",
      description: "Manage your profile and account preferences.",
      profileTitle: "Profile",
      displayName: "Display name",
      saveName: "Save display name",
      nameSaved: "Your display name has been saved.",
      emailTitle: "Account email",
      currentEmail: "Current email: {{email}}",
      newEmail: "New email address",
      changeEmail: "Request email change",
      emailDescription: "Approve the change from your current inbox, then verify the new address. Your email will only change after both steps.",
      emailRequested: "If the change can proceed, an approval link will be sent to {{email}}. After approval, check your new inbox for a verification link.",
      passwordTitle: "Password",
      passwordDescription: "Send a reset link to {{email}} to choose a new password. Completing the reset signs you out of all sessions.",
    },
  },
  emailChange: {
    title: "Change account email",
    description: "Approve your email change and verify your new address.",
    confirmPrompt: "Approve this request to send a verification link to your new email address. Your account email has not changed yet.",
    verifyPrompt: "Verify this new address to finish changing your account email.",
    approve: "Approve email change",
    verify: "Verify new email",
    approved: "Request approved. Check your new inbox for the verification link. Your account email has not changed yet.",
    completed: "Your account email has been changed. Use the new address when logging in.",
    invalid: "This email change link is invalid, expired, or no longer available. Request another change from settings.",
    checkFailed: "We could not check this email change link. Please try again.",
    settings: "Go to account settings",
  },
  routes: {
    catalog: { title: "Product catalog", description: "Browse available training products." },
    productDetail: { title: "Product details", description: "Review product details and purchasing information." },
    verifyEmail: { title: "Email verification", description: "Complete or review your email verification." },
    verifyCertificate: { title: "Certificate verification", description: "Review the public verification result." },
    sharedCertificate: { title: "Shared certificate", description: "View certificate information shared with this link." },
    enrollments: { title: "Enrollments", description: "Review learner assignments and training status." },
    enrollmentDetail: { title: "Enrollment details", description: "Review assignment details and access instructions." },
    learners: { title: "Learners", description: "Manage your personal learner profile and permitted learners." },
    learnerDetail: { title: "Learner details", description: "Review a learner profile and related assignments." },
    orderDetail: { title: "Order details", description: "Review items, recipients, payment, and fulfillment." },
    certificates: { title: "Certificates", description: "Review certificates and their current statuses." },
    certificateDetail: { title: "Certificate details", description: "Review certificate status and available documents." },
    checkout: { title: "Checkout", description: "Review the purchase and recipient details." },
    checkoutReturn: { title: "Payment status", description: "Review the confirmed result of your checkout." },
    admin: { title: "Administration", description: "Review operational records and outstanding work." },
    adminLearners: { title: "Learner records", description: "Search learners and review permitted details." },
    adminLearnerDetail: { title: "Learner record", description: "Review a learner profile and related history." },
    adminCourses: { title: "Course records", description: "Review available course definitions." },
    adminEnrollments: { title: "Enrollment records", description: "Find assignments and review their status." },
    adminEnrollmentDetail: { title: "Enrollment record", description: "Review assignment, fulfillment, and training details." },
    adminCertificates: { title: "Certificate records", description: "Search certificate records and identify updates needed." },
    adminCertificateDetail: { title: "Certificate record", description: "Review certificate metadata and history." },
    adminOrders: { title: "Order records", description: "Find orders by purchaser, reference, status, or date." },
    adminOrderDetail: { title: "Order record", description: "Review order and fulfillment context." },
    adminNavigation: { overview: "Overview", learners: "Learners", courses: "Courses", enrollments: "Enrollments", certificates: "Certificates", orders: "Orders" },
  },
} as const;

type WidenStringValues<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenStringValues<T[Key]>;
};

export type TranslationResource = WidenStringValues<typeof en>;
