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
      organizations: "Organizations",
      orders: "Orders",
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
} as const;

type WidenStringValues<T> = {
  [Key in keyof T]: T[Key] extends string ? string : WidenStringValues<T[Key]>;
};

export type TranslationResource = WidenStringValues<typeof en>;
