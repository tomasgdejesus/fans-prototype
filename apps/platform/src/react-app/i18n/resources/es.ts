import type { TranslationResource } from "./en";

export const es = {
  common: {
    brand: "FANS",
    language: {
      label: "Idioma",
      english: "English",
      spanish: "Español",
    },
    actions: {
      logIn: "Iniciar sesión",
      dashboard: "Panel",
      returnHome: "Volver al inicio",
      backToLogIn: "Volver a iniciar sesión",
      backToCourses: "Volver a los cursos",
      backToOrganizations: "Volver a las organizaciones",
    },
    navigation: {
      main: "Principal",
    },
    placeholder: {
      comingSoon: "Próximamente",
      beingBuilt: "Esta sección está en desarrollo.",
    },
  },
  home: {
    tagline: "Capacitación en seguridad alimentaria y gestión de certificados.",
    serviceStatus: "Estado del servicio",
    apiStatus: "API: {{status}}",
    status: {
      checking: "comprobando",
      unavailable: "no disponible",
      available: "disponible",
    },
    healthCheckError: "Falló la comprobación del estado de la API",
  },
  auth: {
    login: {
      title: "Iniciar sesión",
      description: "Inicia sesión para acceder a tu capacitación y cuenta.",
      createAccount: "Crear una cuenta",
      forgotPassword: "¿Olvidaste tu contraseña?",
    },
    register: {
      title: "Crear una cuenta",
      description: "Comienza tu capacitación con FANS.",
      existingAccount: "¿Ya tienes una cuenta? Inicia sesión",
    },
    forgotPassword: {
      title: "Olvidé mi contraseña",
      description: "Solicita ayuda para restablecer tu contraseña.",
    },
    resetPassword: {
      title: "Restablecer contraseña",
      description: "Elige una nueva contraseña para tu cuenta.",
    },
  },
  errors: {
    notFound: {
      title: "Página no encontrada",
      description: "No se pudo encontrar la página solicitada.",
    },
  },
  dashboard: {
    navigation: {
      label: "Panel",
      open: "Abrir navegación",
      close: "Cerrar navegación",
      overview: "Resumen",
      courses: "Cursos",
      organizations: "Organizaciones",
      orders: "Pedidos",
      settings: "Configuración",
    },
    tagline: "Capacitación y certificados de seguridad alimentaria",
    overview: {
      title: "Resumen",
      description: "Tu capacitación y tu cuenta, en un solo lugar.",
      sections: {
        courses: {
          title: "Cursos",
          description: "Accede a la capacitación y sigue tu progreso de aprendizaje.",
          action: "Ver cursos",
        },
        organizations: {
          title: "Organizaciones",
          description: "Administra tus organizaciones y la capacitación de empleados.",
          action: "Ver organizaciones",
        },
        orders: {
          title: "Pedidos",
          description: "Consulta compras y detalles de pedidos.",
          action: "Ver pedidos",
        },
      },
    },
    courses: {
      title: "Cursos",
      description: "Accede a la capacitación y sigue tu progreso de aprendizaje.",
      detailTitle: "Detalles del curso",
      detailDescription: "Consulta el contenido, los requisitos y el progreso del curso.",
    },
    organizations: {
      title: "Organizaciones",
      description: "Administra organizaciones, empleados y asignaciones de capacitación.",
      detailTitle: "Detalles de la organización",
      detailDescription: "Consulta los empleados y administra sus asignaciones de capacitación.",
    },
    orders: {
      title: "Pedidos",
      description: "Consulta compras, detalles de pedidos y recibos.",
    },
    settings: {
      title: "Configuración",
      description: "Administra tu perfil y las preferencias de tu cuenta.",
    },
  },
} satisfies TranslationResource;
