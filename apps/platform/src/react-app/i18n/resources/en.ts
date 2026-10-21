export const en = {
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
    },
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
