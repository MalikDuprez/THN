// src/api/feedback.ts
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface BookingFeedback {
  id: string;
  booking_id: string;
  user_id: string;
  user_role: "client" | "coiffeur";
  overall_rating: number;
  was_on_time: boolean | null;
  location_was_correct: boolean | null;
  service_as_expected: boolean | null;
  duration_as_expected: boolean | null;
  comment: string | null;
  created_at: string;
}

export interface FeedbackInput {
  booking_id: string;
  overall_rating: number;
  was_on_time?: boolean;
  location_was_correct?: boolean;
  service_as_expected?: boolean;
  duration_as_expected?: boolean;
  comment?: string;
}

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
 * Soumettre un feedback pour un RDV
 */
export async function submitFeedback(input: FeedbackInput): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  // Déterminer le rôle de l'utilisateur pour ce booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("client_id, coiffeur_id")
    .eq("id", input.booking_id)
    .single();

  if (!booking) return false;

  const coiffeurId = await getMyCoiffeurId();
  const isCoiffeur = coiffeurId === booking.coiffeur_id;
  const userRole = isCoiffeur ? "coiffeur" : "client";

  const { error } = await supabase
    .from("booking_feedback")
    .insert({
      booking_id: input.booking_id,
      user_id: userId,
      user_role: userRole,
      overall_rating: input.overall_rating,
      was_on_time: input.was_on_time ?? null,
      location_was_correct: input.location_was_correct ?? null,
      service_as_expected: input.service_as_expected ?? null,
      duration_as_expected: input.duration_as_expected ?? null,
      comment: input.comment || null,
    });

  if (error) {
    console.error("Error submitting feedback:", error);
    return false;
  }

  // Mettre à jour la note moyenne du coiffeur ou du client
  if (isCoiffeur) {
    // Le coiffeur note le client
    await updateClientRating(booking.client_id);
  } else {
    // Le client note le coiffeur
    await updateCoiffeurRating(booking.coiffeur_id);
  }

  return true;
}

/**
 * Vérifier si l'utilisateur a déjà donné son feedback
 */
export async function hasFeedbackForBooking(bookingId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("booking_feedback")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking feedback:", error);
  }

  return !!data;
}

/**
 * Récupérer le feedback d'un booking
 */
export async function getFeedbackForBooking(bookingId: string): Promise<BookingFeedback[]> {
  const { data, error } = await supabase
    .from("booking_feedback")
    .select("*")
    .eq("booking_id", bookingId);

  if (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }

  return data || [];
}

/**
 * Mettre à jour la note moyenne d'un coiffeur
 */
async function updateCoiffeurRating(coiffeurId: string): Promise<void> {
  // Calculer la nouvelle moyenne
  const { data } = await supabase
    .from("booking_feedback")
    .select("overall_rating")
    .eq("user_role", "client") // Seuls les clients notent les coiffeurs
    .in("booking_id", 
      supabase
        .from("bookings")
        .select("id")
        .eq("coiffeur_id", coiffeurId)
    );

  if (!data || data.length === 0) return;

  const avgRating = data.reduce((sum, f) => sum + f.overall_rating, 0) / data.length;

  await supabase
    .from("coiffeurs")
    .update({ 
      rating: Math.round(avgRating * 10) / 10,
      reviews_count: data.length,
      updated_at: new Date().toISOString()
    })
    .eq("id", coiffeurId);
}

/**
 * Mettre à jour la note moyenne d'un client
 */
async function updateClientRating(clientId: string): Promise<void> {
  // Calculer la nouvelle moyenne
  const { data } = await supabase
    .from("booking_feedback")
    .select("overall_rating")
    .eq("user_role", "coiffeur") // Seuls les coiffeurs notent les clients
    .in("booking_id",
      supabase
        .from("bookings")
        .select("id")
        .eq("client_id", clientId)
    );

  if (!data || data.length === 0) return;

  const avgRating = data.reduce((sum, f) => sum + f.overall_rating, 0) / data.length;

  await supabase
    .from("profiles")
    .update({ 
      rating_as_client: Math.round(avgRating * 10) / 10,
      updated_at: new Date().toISOString()
    })
    .eq("id", clientId);
}