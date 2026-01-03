// src/types/database.ts

// ============ ENUMS ============
export type UserRole = "client" | "coiffeur" | "salon_owner";
export type BookingLocation = "salon" | "domicile";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type ServiceCategory = "coupe" | "coloration" | "soin" | "barbe" | "mariage" | "brushing" | "autre";

// ============ PROFILES ============
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole | null;
  gender: string | null;
  birth_date: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ============ COIFFEURS ============
export interface Coiffeur {
  id: string;
  profile_id: string;
  salon_id: string | null;
  display_name: string | null;
  specialty: string | null;
  bio: string | null;
  years_experience: number | null;
  offers_home_service: boolean;
  home_service_fee_cents: number;
  home_service_radius_km: number;
  city: string | null;
  address_line: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  portfolio_urls: string[];
  is_available: boolean;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface CoiffeurWithDetails extends Coiffeur {
  profile?: Profile;
  salon?: Salon;
  services?: Service[];
}

// ============ SALONS ============
export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address_line: string | null;
  city: string | null;
  phone: string | null;
  avatar_url: string | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ SERVICES ============
export interface Service {
  id: string;
  coiffeur_id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  duration_minutes: number;
  price_cents: number;
  available_at_salon: boolean;
  available_at_home: boolean;
  home_surcharge_cents: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ============ BOOKINGS ============
export interface Booking {
  id: string;
  client_id: string;
  coiffeur_id: string;
  salon_id: string | null;
  start_at: string;
  end_at: string;
  total_duration_minutes: number;
  location: BookingLocation;
  address_id: string | null;
  address_snapshot: AddressSnapshot | null;
  subtotal_cents: number;
  home_fee_cents: number;
  platform_fee_cents: number;
  discount_cents: number;
  total_cents: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_intent_id: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  client_has_reviewed: boolean;
  coiffeur_has_reviewed: boolean;
  client_notes: string | null;
  coiffeur_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  coiffeur?: CoiffeurWithDetails;
  client?: Profile;
  items?: BookingItem[];
}

// ============ BOOKING ITEMS ============
export interface BookingItem {
  id: string;
  booking_id: string;
  service_id: string;
  service_name: string;
  price_cents: number;
  duration_minutes: number;
  position: number;
  created_at: string;
}

// ============ ADDRESSES ============
export interface AddressSnapshot {
  address_line: string;
  city: string;
  postal_code?: string;
  country?: string;
}

// ============ NOTIFICATIONS ============
export type NotificationType =
  | "new_booking"           // Client a réservé (pour coiffeur)
  | "booking_confirmed"     // RDV confirmé (pour client)
  | "booking_cancelled"     // RDV annulé (pour les deux)
  | "booking_reminder"      // Rappel RDV (J-1 ou H-2)
  | "booking_completed"     // RDV terminé, laisser un avis (pour client)
  | "new_message"           // Nouveau message chat
  | "new_review"            // Nouvel avis reçu
  | "review_response"       // Réponse à un avis
  | "welcome"               // Bienvenue
  | "promo";                // Promotion

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: NotificationData;
  actor_id: string | null;
  image_url: string | null;
  target_role: "client" | "coiffeur" | null; // Nouveau champ
  is_read: boolean;
  read_at: string | null;
  push_sent: boolean;
  push_sent_at: string | null;
  push_error: string | null;
  created_at: string;
}

export interface NotificationData {
  booking_id?: string;
  coiffeur_id?: string;
  conversation_id?: string;
  review_id?: string;
  [key: string]: unknown;
}

export interface NotificationWithActor extends Notification {
  actor?: Profile;
}

// ============ HELPERS ============
export const centsToEuros = (cents: number): number => cents / 100;

export const formatPriceShort = (cents: number): string => {
  const euros = centsToEuros(cents);
  return euros % 1 === 0 ? `${euros} €` : `${euros.toFixed(2).replace('.', ',')} €`;
};