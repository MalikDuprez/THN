// src/api/disputes.ts
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export type DisputeType = 
  | "no_show_coiffeur"   // Coiffeur ne s'est pas présenté
  | "no_show_client"     // Client absent
  | "late_arrival"       // Retard important
  | "wrong_location"     // Mauvaise adresse
  | "service_issue"      // Problème avec la prestation
  | "payment_issue"      // Problème de paiement
  | "behavior_issue"     // Problème de comportement
  | "other";             // Autre

export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected";

export interface BookingDispute {
  id: string;
  booking_id: string;
  opened_by: string;
  opened_by_role: "client" | "coiffeur";
  dispute_type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeInput {
  booking_id: string;
  dispute_type: DisputeType;
  description: string;
}

export const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  no_show_coiffeur: "Le coiffeur ne s'est pas présenté",
  no_show_client: "Le client était absent",
  late_arrival: "Retard important",
  wrong_location: "L'adresse était incorrecte",
  service_issue: "Problème avec la prestation",
  payment_issue: "Problème de paiement",
  behavior_issue: "Problème de comportement",
  other: "Autre problème",
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Ouverte",
  in_review: "En cours d'examen",
  resolved: "Résolue",
  rejected: "Rejetée",
};

// ============================================
// HELPERS
// ============================================

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

async function getMyCoiffeurId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("profile_id", userId)
    .single();

  return data?.id || null;
}

// ============================================
// FONCTIONS
// ============================================

/**
 * Ouvrir une réclamation
 */
export async function openDispute(input: DisputeInput): Promise<BookingDispute | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Déterminer le rôle de l'utilisateur pour ce booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("client_id, coiffeur_id")
    .eq("id", input.booking_id)
    .single();

  if (!booking) return null;

  const coiffeurId = await getMyCoiffeurId();
  const isCoiffeur = coiffeurId === booking.coiffeur_id;
  const userRole = isCoiffeur ? "coiffeur" : "client";

  const { data, error } = await supabase
    .from("booking_disputes")
    .insert({
      booking_id: input.booking_id,
      opened_by: userId,
      opened_by_role: userRole,
      dispute_type: input.dispute_type,
      description: input.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error opening dispute:", error);
    return null;
  }

  return data;
}

/**
 * Récupérer les réclamations d'un booking
 */
export async function getDisputesForBooking(bookingId: string): Promise<BookingDispute[]> {
  const { data, error } = await supabase
    .from("booking_disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching disputes:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupérer toutes mes réclamations
 */
export async function getMyDisputes(): Promise<BookingDispute[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("booking_disputes")
    .select("*")
    .eq("opened_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my disputes:", error);
    return [];
  }

  return data || [];
}

/**
 * Vérifier si un booking a une réclamation ouverte
 */
export async function hasOpenDispute(bookingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("booking_disputes")
    .select("id")
    .eq("booking_id", bookingId)
    .in("status", ["open", "in_review"])
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking dispute:", error);
  }

  return !!data;
}

/**
 * Annuler une réclamation (si elle est encore ouverte)
 */
export async function cancelDispute(disputeId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("booking_disputes")
    .delete()
    .eq("id", disputeId)
    .eq("opened_by", userId)
    .eq("status", "open");

  if (error) {
    console.error("Error cancelling dispute:", error);
    return false;
  }

  return true;
}