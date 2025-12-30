// src/api/bookings.ts
import { supabase } from "@/lib/supabase";
import type {
  Booking,
  BookingWithDetails,
  BookingLocation,
  BookingStatus,
  AddressSnapshot,
} from "@/types/database";

// ============ TYPES POUR CRÉATION ============

export interface CreateBookingInput {
  coiffeur_id: string;
  salon_id?: string | null;
  start_at: string;
  location: BookingLocation;
  address_snapshot?: AddressSnapshot | null;
  client_notes?: string;
  services: {
    service_id: string;
    service_name: string;
    price_cents: number;
    duration_minutes: number;
    position?: number;
  }[];
  home_fee_cents?: number;
}

export interface CreateBookingResult {
  success: boolean;
  booking?: BookingWithDetails;
  error?: string;
}

// Buffer avant et après chaque réservation (en minutes)
const BUFFER_MINUTES = 30;

// ============ CREATE ============

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Vous devez être connecté pour réserver" };
    }

    const subtotal_cents = input.services.reduce((sum, s) => sum + s.price_cents, 0);
    const total_duration_minutes = input.services.reduce((sum, s) => sum + s.duration_minutes, 0);
    const home_fee_cents = input.location === "domicile" ? (input.home_fee_cents || 0) : 0;
    const platform_fee_cents = 0;
    const total_cents = subtotal_cents + home_fee_cents + platform_fee_cents;

    const startDate = new Date(input.start_at);

    if (isNaN(startDate.getTime())) {
      return { success: false, error: "Date invalide" };
    }

    // end_at = start + durée prestation (sans buffer, le buffer est géré à l'affichage)
    const endDate = new Date(startDate.getTime() + total_duration_minutes * 60 * 1000);

    const start_at_iso = startDate.toISOString();
    const end_at_iso = endDate.toISOString();

    console.log("📅 Creating booking:", {
      start_at_iso,
      end_at_iso,
      total_duration_minutes,
      buffer: BUFFER_MINUTES,
    });

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        client_id: user.id,
        coiffeur_id: input.coiffeur_id,
        salon_id: input.salon_id || null,
        start_at: start_at_iso,
        end_at: end_at_iso,
        total_duration_minutes,
        location: input.location,
        address_snapshot: input.address_snapshot || null,
        subtotal_cents,
        home_fee_cents,
        platform_fee_cents,
        discount_cents: 0,
        total_cents,
        status: "confirmed",
        payment_status: "pending",
        client_notes: input.client_notes || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);

      if (bookingError.code === "P0001") {
        return { success: false, error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." };
      }
      if (bookingError.code === "23505") {
        return { success: false, error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre." };
      }
      if (bookingError.code === "23503") {
        return { success: false, error: "Coiffeur ou service introuvable." };
      }

      return { success: false, error: "Erreur lors de la création de la réservation" };
    }

    const bookingItems = input.services.map((service, index) => ({
      booking_id: booking.id,
      service_id: service.service_id,
      service_name: service.service_name,
      price_cents: service.price_cents,
      duration_minutes: service.duration_minutes,
      position: service.position ?? index,
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) {
      console.error("Error creating booking items:", itemsError);
    }

    const fullBooking = await getBookingById(booking.id);

    return { success: true, booking: fullBooking || booking };
  } catch (error) {
    console.error("Unexpected error creating booking:", error);
    return { success: false, error: "Une erreur inattendue s'est produite" };
  }
}

// ============ READ ============

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      coiffeur:coiffeurs(
        *,
        profile:profiles(*),
        salon:salons(*)
      ),
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching booking:", error);
    return null;
  }

  return data;
}

export async function getClientBookings(clientId?: string): Promise<BookingWithDetails[]> {
  let userId = clientId;

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    console.error("No user ID available");
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      coiffeur:coiffeurs(
        *,
        profile:profiles(*),
        salon:salons(*)
      ),
      items:booking_items(*)
    `)
    .eq("client_id", userId)
    .order("start_at", { ascending: false });

  if (error) {
    console.error("Error fetching client bookings:", error);
    return [];
  }

  return data || [];
}

export async function getCoiffeurBookings(coiffeurId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching coiffeur bookings:", error);
    return [];
  }

  return data || [];
}

export async function getUpcomingBookings(): Promise<BookingWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      coiffeur:coiffeurs(
        *,
        profile:profiles(*),
        salon:salons(*)
      ),
      items:booking_items(*)
    `)
    .eq("client_id", user.id)
    .gte("start_at", now)
    .in("status", ["pending", "confirmed"])
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming bookings:", error);
    return [];
  }

  return data || [];
}

export async function getPastBookings(): Promise<BookingWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      coiffeur:coiffeurs(
        *,
        profile:profiles(*),
        salon:salons(*)
      ),
      items:booking_items(*)
    `)
    .eq("client_id", user.id)
    .in("status", ["completed", "cancelled", "no_show"])
    .order("start_at", { ascending: false });

  if (error) {
    console.error("Error fetching past bookings:", error);
    return [];
  }

  return data || [];
}

// ============ UPDATE ============

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<boolean> {
  const updateData: Partial<Booking> = { status };

  if (status === "cancelled") {
    const { data: { user } } = await supabase.auth.getUser();
    Object.assign(updateData, {
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id,
    });
  }

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating booking status:", error);
    return false;
  }

  return true;
}

export async function confirmPayment(
  bookingId: string,
  paymentIntentId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_intent_id: paymentIntentId || null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error confirming payment:", error);
    return false;
  }

  return true;
}

export async function cancelBooking(
  id: string,
  reason?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id,
      cancellation_reason: reason || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling booking:", error);
    return false;
  }

  return true;
}

export async function markAsReviewed(
  bookingId: string,
  asClient: boolean = true
): Promise<boolean> {
  const column = asClient ? "client_has_reviewed" : "coiffeur_has_reviewed";

  const { error } = await supabase
    .from("bookings")
    .update({ [column]: true })
    .eq("id", bookingId);

  if (error) {
    console.error("Error marking as reviewed:", error);
    return false;
  }

  return true;
}

// ============ UTILS ============

const ALL_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30",
];

// Convertit "HH:MM" en minutes depuis minuit
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Extrait l'heure en minutes depuis minuit d'une date ISO (en heure locale)
function dateToMinutes(isoDate: string): number {
  const date = new Date(isoDate);
  return date.getHours() * 60 + date.getMinutes();
}

export async function getCoiffeurAvailableSlots(
  coiffeurId: string,
  date: string,
  durationMinutes: number = 30
): Promise<string[]> {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("start_at, end_at, total_duration_minutes")
    .eq("coiffeur_id", coiffeurId)
    .gte("start_at", startOfDay)
    .lte("start_at", endOfDay)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Error fetching coiffeur bookings:", error);
    return ALL_SLOTS;
  }

  if (!bookings || bookings.length === 0) {
    console.log("✅ No bookings, all slots available");
    return ALL_SLOTS;
  }

  // Convertir les bookings en zones bloquées (en minutes depuis minuit)
  const blockedZones = bookings.map(booking => {
    const startMinutes = dateToMinutes(booking.start_at);
    const duration = booking.total_duration_minutes || 30;

    // Zone bloquée = [start - buffer_avant, start + durée + buffer_après]
    return {
      start: startMinutes - BUFFER_MINUTES,
      end: startMinutes + duration + BUFFER_MINUTES,
    };
  });

  console.log("📆 Date:", date);
  console.log("⏱️ New booking duration:", durationMinutes, "min");
  console.log("🔒 Blocked zones:", blockedZones.map(z =>
    `${Math.floor(z.start / 60)}:${String(z.start % 60).padStart(2, '0')} - ${Math.floor(z.end / 60)}:${String(z.end % 60).padStart(2, '0')}`
  ));

  const unavailableSlots: string[] = [];

  const availableSlots = ALL_SLOTS.filter(slot => {
    const slotStartMinutes = timeToMinutes(slot);
    const slotEndMinutes = slotStartMinutes + durationMinutes;

    // Vérifier si ce créneau chevauche une zone bloquée
    const hasOverlap = blockedZones.some(zone => {
      return slotStartMinutes < zone.end && slotEndMinutes > zone.start;
    });

    if (hasOverlap) {
      unavailableSlots.push(slot);
    }

    return !hasOverlap;
  });

  console.log("🚫 Grisés:", unavailableSlots);
  console.log("✅ Disponibles:", availableSlots);

  return availableSlots;
}

// ============ RÉSERVATIONS COIFFEUR CONNECTÉ ============

// Récupérer l'ID du coiffeur connecté
async function getMyCoiffeurId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: coiffeur } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  return coiffeur?.id || null;
}

// Récupérer les réservations du coiffeur connecté pour aujourd'hui
export async function getCoiffeurTodayBookings(): Promise<BookingWithDetails[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .gte("start_at", startOfDay.toISOString())
    .lte("start_at", endOfDay.toISOString())
    .in("status", ["pending", "confirmed"])
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching today bookings:", error);
    return [];
  }

  return data || [];
}

// Récupérer les réservations à venir du coiffeur (après maintenant)
export async function getCoiffeurUpcomingBookings(): Promise<BookingWithDetails[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .gte("start_at", now)
    .in("status", ["pending", "confirmed"])
    .order("start_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error fetching upcoming bookings:", error);
    return [];
  }

  return data || [];
}

// Récupérer les réservations passées du coiffeur
export async function getCoiffeurPastBookings(): Promise<BookingWithDetails[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .lte("end_at", now)
    .order("start_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching past bookings:", error);
    return [];
  }

  return data || [];
}

// Récupérer les réservations par date spécifique
export async function getCoiffeurBookingsByDate(date: Date): Promise<BookingWithDetails[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .gte("start_at", startOfDay.toISOString())
    .lte("start_at", endOfDay.toISOString())
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching bookings by date:", error);
    return [];
  }

  return data || [];
}

// Récupérer les réservations en attente (pending) pour le coiffeur
export async function getCoiffeurPendingBookings(): Promise<BookingWithDetails[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      client:profiles!bookings_client_id_fkey(*),
      items:booking_items(*)
    `)
    .eq("coiffeur_id", coiffeurId)
    .eq("status", "pending")
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending bookings:", error);
    return [];
  }

  return data || [];
}

// ============ ACTIONS COIFFEUR SUR RÉSERVATIONS ============

// Accepter une réservation
export async function acceptBooking(bookingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: "confirmed",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) {
    console.error("Error accepting booking:", error);
    return false;
  }

  return true;
}

// Refuser une réservation
export async function declineBooking(bookingId: string, reason?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.id,
      cancellation_reason: reason || "Refusé par le coiffeur",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) {
    console.error("Error declining booking:", error);
    return false;
  }

  return true;
}

// Marquer une réservation comme terminée
export async function completeBooking(bookingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("status", "confirmed");

  if (error) {
    console.error("Error completing booking:", error);
    return false;
  }

  return true;
}

// Marquer un client comme absent (no show)
export async function markNoShow(bookingId: string): Promise<boolean> {
  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: "no_show",
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Error marking no show:", error);
    return false;
  }

  return true;
}

// ============ STATISTIQUES COIFFEUR ============

export interface CoiffeurStats {
  todayBookings: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalClients: number;
  completedBookings: number;
  pendingBookings: number;
}

// Récupérer les statistiques du coiffeur connecté
export async function getCoiffeurStats(): Promise<CoiffeurStats> {
  const defaultStats: CoiffeurStats = {
    todayBookings: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalClients: 0,
    completedBookings: 0,
    pendingBookings: 0,
  };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return defaultStats;

  const { data: coiffeur } = await supabase
    .from("coiffeurs")
    .select("id, bookings_completed")
    .eq("profile_id", user.id)
    .single();

  if (!coiffeur) return defaultStats;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Début de la semaine (lundi)
  const startOfWeek = new Date(startOfToday);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  
  // Début du mois
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // RDV aujourd'hui (confirmés)
  const { data: todayData } = await supabase
    .from("bookings")
    .select("total_cents")
    .eq("coiffeur_id", coiffeur.id)
    .gte("start_at", startOfToday.toISOString())
    .in("status", ["confirmed", "completed"]);

  // Revenus semaine (complétés seulement)
  const { data: weekData } = await supabase
    .from("bookings")
    .select("total_cents")
    .eq("coiffeur_id", coiffeur.id)
    .gte("start_at", startOfWeek.toISOString())
    .eq("status", "completed");

  // Revenus mois (complétés seulement)
  const { data: monthData } = await supabase
    .from("bookings")
    .select("total_cents")
    .eq("coiffeur_id", coiffeur.id)
    .gte("start_at", startOfMonth.toISOString())
    .eq("status", "completed");

  // Clients uniques (sur tous les RDV complétés)
  const { data: clientsData } = await supabase
    .from("bookings")
    .select("client_id")
    .eq("coiffeur_id", coiffeur.id)
    .eq("status", "completed");

  // Compteur de clients uniques
  const uniqueClients = new Set(clientsData?.map(b => b.client_id) || []);

  // RDV en attente
  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("coiffeur_id", coiffeur.id)
    .eq("status", "pending");

  const todayBookings = todayData?.length || 0;
  const todayRevenue = todayData?.reduce((sum, b) => sum + (b.total_cents || 0), 0) || 0;
  const weekRevenue = weekData?.reduce((sum, b) => sum + (b.total_cents || 0), 0) || 0;
  const monthRevenue = monthData?.reduce((sum, b) => sum + (b.total_cents || 0), 0) || 0;

  return {
    todayBookings,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalClients: uniqueClients.size,
    completedBookings: coiffeur.bookings_completed || 0,
    pendingBookings: pendingCount || 0,
  };
}

// Vérifier si une date a des RDV (pour afficher un point sur le calendrier)
export async function getCoiffeurDatesWithBookings(
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  const coiffeurId = await getMyCoiffeurId();
  if (!coiffeurId) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("start_at")
    .eq("coiffeur_id", coiffeurId)
    .gte("start_at", startDate.toISOString())
    .lte("start_at", endDate.toISOString())
    .neq("status", "cancelled");

  if (error) {
    console.error("Error fetching dates with bookings:", error);
    return [];
  }

  // Extraire les dates uniques (format YYYY-MM-DD)
  const dates = new Set<string>();
  data?.forEach(booking => {
    const date = new Date(booking.start_at);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dates.add(dateStr);
  });

  return Array.from(dates);
}