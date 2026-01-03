// src/constants/pricing.ts

// ============================================
// FRAIS DE PLATEFORME
// ============================================

export const PLATFORM_FEE = {
  // Pourcentage de commission (domicile uniquement)
  PERCENTAGE: 0.05, // 5%
  
  // Minimum en centimes
  MIN_CENTS: 99, // 0.99€
  
  // Maximum en centimes (plafond)
  MAX_CENTS: 199, // 1.99€
};

// ============================================
// FONCTIONS DE CALCUL
// ============================================

/**
 * Calcule les frais de plateforme
 * @param subtotalCents - Montant de la prestation en centimes
 * @param location - "domicile" ou "salon" (salon = 0 frais)
 * @returns Frais de plateforme en centimes
 */
export function calculatePlatformFee(
  subtotalCents: number,
  location: "domicile" | "salon" = "domicile"
): number {
  // V1: Pas de frais pour les réservations en salon
  if (location === "salon") {
    return 0;
  }
  
  // Calcul du pourcentage
  let fee = Math.round(subtotalCents * PLATFORM_FEE.PERCENTAGE);
  
  // Appliquer le minimum
  fee = Math.max(fee, PLATFORM_FEE.MIN_CENTS);
  
  // Appliquer le plafond
  fee = Math.min(fee, PLATFORM_FEE.MAX_CENTS);
  
  return fee;
}

/**
 * Calcule le total avec les frais
 * @param subtotalCents - Montant de la prestation en centimes
 * @param homeFeeCents - Frais de déplacement en centimes (optionnel)
 * @param location - "domicile" ou "salon"
 * @returns Objet avec tous les montants
 */
export function calculateBookingTotal(
  subtotalCents: number,
  homeFeeCents: number = 0,
  location: "domicile" | "salon" = "domicile"
): {
  subtotalCents: number;
  homeFeeCents: number;
  platformFeeCents: number;
  totalCents: number;
} {
  const platformFeeCents = calculatePlatformFee(subtotalCents + homeFeeCents, location);
  const totalCents = subtotalCents + homeFeeCents + platformFeeCents;
  
  return {
    subtotalCents,
    homeFeeCents,
    platformFeeCents,
    totalCents,
  };
}

// ============================================
// MÉTHODES DE PAIEMENT
// ============================================

export type PaymentMethod = "card" | "apple_pay" | "google_pay" | "cash";

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: string;
  description?: string;
}[] = [
  {
    id: "card",
    label: "Carte bancaire",
    icon: "card-outline",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    icon: "logo-apple",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    icon: "logo-google",
  },
  {
    id: "cash",
    label: "Espèces",
    icon: "cash-outline",
    description: "Payez les frais en ligne, le reste en espèces",
  },
];