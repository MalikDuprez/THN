// src/constants/routes.ts
// Fichier centralisé pour toutes les routes de l'application
// Utilisation: import { ROUTES } from '@/constants/routes';

export const ROUTES = {
  // ═══════════════════════════════════════════════════════════
  // 🔐 AUTH - Pages non authentifiées
  // ═══════════════════════════════════════════════════════════
  AUTH: {
    WELCOME: "/(auth)/welcome",
    LOGIN: "/(auth)/login",
    REGISTER: "/(auth)/register",
    ROLE_SELECTION: "/(auth)/role-selection",
  },

  // ═══════════════════════════════════════════════════════════
  // 📱 CLIENT - Tabs principales
  // ═══════════════════════════════════════════════════════════
  CLIENT: {
    // Tabs
    HOME: "/(app)/(tabs)/",
    SALON: "/(app)/(tabs)/salon",
    ACTIVITY: "/(app)/(tabs)/activity",
    PROFILE: "/(app)/(tabs)/profile",

    // Booking flow (navigation relative dans le Stack)
    BOOKING: {
      SERVICE: "/(app)/(client)/booking/service",
      DATE: "./date",      // Relatif depuis service
      TIME: "./time",      // Relatif depuis date
      CONFIRM: "./confirm", // Relatif depuis time
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 💼 PRO - Interface professionnelle
  // ═══════════════════════════════════════════════════════════
  PRO: {
    // Tabs
    DASHBOARD: "/(app)/(pro)/(tabs)/dashboard",
    AGENDA: "/(app)/(pro)/(tabs)/agenda",
    VITRINE: "/(app)/(pro)/(tabs)/vitrine",
    PROFILE: "/(app)/(pro)/(tabs)/profile-pro",

    // Pages
    CLIENTS: "/(app)/(pro)/clients",
    EARNINGS: "/(app)/(pro)/earnings",
    MESSAGES: "/(app)/(pro)/messages",
    SETTINGS: "/(app)/(pro)/settings-pro",

    // Portfolio
    PORTFOLIO: "/(app)/(pro)/portfolio",
    PORTFOLIO_ADD: "/(app)/(pro)/portfolio/add",

    // Services
    SERVICES: "/(app)/(pro)/services",
    SERVICE_DETAIL: (id: string) => `/(app)/(pro)/services/${id}` as const,
  },

  // ═══════════════════════════════════════════════════════════
  // 🔗 SHARED - Pages partagées (client & pro)
  // ═══════════════════════════════════════════════════════════
  SHARED: {
    // Pages dynamiques
    COIFFEUR: (id: string) => `/(app)/(shared)/coiffeur/${id}` as const,
    INSPIRATION: (id: string) => `/(app)/(shared)/inspiration/${id}` as const,
    FEEDBACK: (bookingId: string) => `/(app)/(shared)/feedback/${bookingId}` as const,
    DISPUTE: (bookingId: string) => `/(app)/(shared)/dispute/${bookingId}` as const,

    // Notifications
    NOTIFICATIONS: "/(app)/(shared)/notifications",

    // Paramètres
    SETTINGS: {
      INDEX: "/(app)/(shared)/settings",
      NOTIFICATIONS: "/(app)/(shared)/settings/notifications",
      LANGUAGE: "/(app)/(shared)/settings/language",
      APPEARANCE: "/(app)/(shared)/settings/appearance",
    },

    // Aide
    HELP: {
      CENTER: "/(app)/(shared)/help/center",
      CONTACT: "/(app)/(shared)/help/contact",
    },

    // Légal
    LEGAL: {
      TERMS: "/(app)/(shared)/legal/terms",
      PRIVACY: "/(app)/(shared)/legal/privacy",
    },

    // Favoris
    FAVORITES: {
      COIFFEURS: "/(app)/(shared)/favorites/coiffeurs",
      SALONS: "/(app)/(shared)/favorites/salons",
      INSPIRATIONS: "/(app)/(shared)/favorites/inspirations",
    },

    // Compte
    ACCOUNT: {
      PERSONAL_INFO: "/(app)/(shared)/account/personal-info",
      PAYMENT_METHODS: "/(app)/(shared)/account/payment-methods",
      ADDRESSES: "/(app)/(shared)/account/addresses",
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════
// 🔧 HELPERS
// ═══════════════════════════════════════════════════════════

// Type pour l'autocomplétion des routes
export type StaticRoute = 
  | typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH]
  | typeof ROUTES.CLIENT.HOME
  | typeof ROUTES.CLIENT.SALON
  | typeof ROUTES.CLIENT.ACTIVITY
  | typeof ROUTES.CLIENT.PROFILE
  | typeof ROUTES.CLIENT.BOOKING[keyof typeof ROUTES.CLIENT.BOOKING]
  | typeof ROUTES.PRO[keyof Omit<typeof ROUTES.PRO, 'SERVICE_DETAIL' | 'PORTFOLIO' | 'PORTFOLIO_ADD' | 'SERVICES'>]
  | typeof ROUTES.PRO.PORTFOLIO
  | typeof ROUTES.PRO.PORTFOLIO_ADD
  | typeof ROUTES.PRO.SERVICES
  | typeof ROUTES.SHARED.NOTIFICATIONS
  | typeof ROUTES.SHARED.SETTINGS[keyof typeof ROUTES.SHARED.SETTINGS]
  | typeof ROUTES.SHARED.HELP[keyof typeof ROUTES.SHARED.HELP]
  | typeof ROUTES.SHARED.LEGAL[keyof typeof ROUTES.SHARED.LEGAL]
  | typeof ROUTES.SHARED.FAVORITES[keyof typeof ROUTES.SHARED.FAVORITES]
  | typeof ROUTES.SHARED.ACCOUNT[keyof typeof ROUTES.SHARED.ACCOUNT];

// Helper pour vérifier si une route existe
export const isValidRoute = (path: string): boolean => {
  const allStaticRoutes = [
    ...Object.values(ROUTES.AUTH),
    ROUTES.CLIENT.HOME,
    ROUTES.CLIENT.SALON,
    ROUTES.CLIENT.ACTIVITY,
    ROUTES.CLIENT.PROFILE,
    ...Object.values(ROUTES.CLIENT.BOOKING),
    ROUTES.PRO.DASHBOARD,
    ROUTES.PRO.AGENDA,
    ROUTES.PRO.VITRINE,
    ROUTES.PRO.PROFILE,
    ROUTES.PRO.CLIENTS,
    ROUTES.PRO.EARNINGS,
    ROUTES.PRO.MESSAGES,
    ROUTES.PRO.SETTINGS,
    ROUTES.PRO.PORTFOLIO,
    ROUTES.PRO.PORTFOLIO_ADD,
    ROUTES.PRO.SERVICES,
    ROUTES.SHARED.NOTIFICATIONS,
    ...Object.values(ROUTES.SHARED.SETTINGS),
    ...Object.values(ROUTES.SHARED.HELP),
    ...Object.values(ROUTES.SHARED.LEGAL),
    ...Object.values(ROUTES.SHARED.FAVORITES),
    ...Object.values(ROUTES.SHARED.ACCOUNT),
  ];
  
  // Vérifier les routes statiques
  if (allStaticRoutes.includes(path as any)) return true;
  
  // Vérifier les routes dynamiques
  if (path.match(/^\/(app)\/\(shared\)\/coiffeur\/[^/]+$/)) return true;
  if (path.match(/^\/(app)\/\(shared\)\/inspiration\/[^/]+$/)) return true;
  if (path.match(/^\/(app)\/\(pro\)\/services\/[^/]+$/)) return true;
  
  return false;
};