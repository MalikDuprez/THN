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
        status: "pending",
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