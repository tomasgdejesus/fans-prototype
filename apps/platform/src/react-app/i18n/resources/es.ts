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
      enrollments: "Inscripciones",
      learners: "Estudiantes",
      orders: "Pedidos",
      certificates: "Certificados",
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
  routes: {
    catalog: { title: "Catálogo de productos", description: "Explora los productos de capacitación disponibles." },
    productDetail: { title: "Detalles del producto", description: "Consulta los detalles y la información de compra." },
    verifyEmail: { title: "Verificación de correo", description: "Completa o revisa la verificación de tu correo." },
    verifyCertificate: { title: "Verificación del certificado", description: "Consulta el resultado de verificación pública." },
    sharedCertificate: { title: "Certificado compartido", description: "Consulta la información compartida mediante este enlace." },
    enrollments: { title: "Inscripciones", description: "Consulta las asignaciones y el estado de capacitación." },
    enrollmentDetail: { title: "Detalles de la inscripción", description: "Consulta la asignación y las instrucciones de acceso." },
    learners: { title: "Estudiantes", description: "Administra tu perfil y los estudiantes autorizados." },
    learnerDetail: { title: "Detalles del estudiante", description: "Consulta el perfil y las asignaciones relacionadas." },
    orderDetail: { title: "Detalles del pedido", description: "Consulta productos, destinatarios, pagos y entrega." },
    certificates: { title: "Certificados", description: "Consulta los certificados y sus estados actuales." },
    certificateDetail: { title: "Detalles del certificado", description: "Consulta el estado y los documentos disponibles." },
    checkout: { title: "Pago", description: "Revisa la compra y los datos del destinatario." },
    checkoutReturn: { title: "Estado del pago", description: "Consulta el resultado confirmado de tu compra." },
    admin: { title: "Administración", description: "Consulta registros operativos y tareas pendientes." },
    adminLearners: { title: "Registros de estudiantes", description: "Busca estudiantes y consulta los datos permitidos." },
    adminLearnerDetail: { title: "Registro del estudiante", description: "Consulta el perfil y el historial relacionado." },
    adminCourses: { title: "Registros de cursos", description: "Consulta las definiciones de cursos disponibles." },
    adminEnrollments: { title: "Registros de inscripciones", description: "Busca asignaciones y consulta su estado." },
    adminEnrollmentDetail: { title: "Registro de inscripción", description: "Consulta la asignación, entrega y capacitación." },
    adminCertificates: { title: "Registros de certificados", description: "Busca certificados e identifica los que requieren cambios." },
    adminCertificateDetail: { title: "Registro del certificado", description: "Consulta los metadatos y el historial del certificado." },
    adminOrders: { title: "Registros de pedidos", description: "Busca pedidos por comprador, referencia, estado o fecha." },
    adminOrderDetail: { title: "Registro del pedido", description: "Consulta el pedido y su contexto de entrega." },
    adminNavigation: { overview: "Resumen", learners: "Estudiantes", courses: "Cursos", enrollments: "Inscripciones", certificates: "Certificados", orders: "Pedidos" },
  },
// New public-page labels use i18next's English fallback until translated.
} satisfies Omit<TranslationResource, "publicPages">;
