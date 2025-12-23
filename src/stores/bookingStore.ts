// src/stores/bookingStore.ts
import { create } from "zustand";
import { createBooking, getClientBookings, cancelBooking as apiCancelBooking, confirmPayment } from "@/api/bookings";
import type { BookingWithDetails, BookingLocation, BookingStatus } from "@/types/database";

// ============ TYPES ============

export interface BookingDraft {
  coiffeur: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    rating: number;
    salon_name?: string;
  };
  service: {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
  };
  location: BookingLocation;
  home_fee_cents: number;
  date: string;
  time: string;
  start_at?: string;
  address?: {
    address_line: string;
    city: string;
    postal_code?: string;
  };
}

// ============ STORE ============

interface BookingState {
  draft: Partial<BookingDraft>;
  bookings: BookingWithDetails[];
  isLoading: boolean;
  
  setCoiffeur: (coiffeur: BookingDraft["coiffeur"]) => void;
  setService: (service: BookingDraft["service"]) => void;
  setLocation: (location: BookingLocation, homeFee?: number) => void;
  setDateTime: (date: string, time: string) => void;
  setAddress: (address: BookingDraft["address"]) => void;
  clearDraft: () => void;
  
  confirmBooking: () => Promise<{ success: boolean; error?: string }>;
  loadBookings: () => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<boolean>;
  
  getUpcomingBookings: () => BookingWithDetails[];
  getPastBookings: () => BookingWithDetails[];
  getActiveBookings: () => BookingWithDetails[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  draft: {},
  bookings: [],
  isLoading: false,

  setCoiffeur: (coiffeur) => {
    set((state) => ({ draft: { ...state.draft, coiffeur } }));
  },

  setService: (service) => {
    set((state) => ({ draft: { ...state.draft, service } }));
  },

  setLocation: (location, homeFee = 0) => {
    set((state) => ({
      draft: { 
        ...state.draft, 
        location,
        home_fee_cents: location === "domicile" ? homeFee : 0,
      },
    }));
  },

  setDateTime: (date, time) => {
    const start_at = `${date}T${time}:00`;
    set((state) => ({ draft: { ...state.draft, date, time, start_at } }));
  },

  setAddress: (address) => {
    set((state) => ({ draft: { ...state.draft, address } }));
  },

  clearDraft: () => {
    set({ draft: {} });
  },

  confirmBooking: async () => {
    const { draft } = get();
    
    if (!draft.coiffeur || !draft.service || !draft.start_at || !draft.location) {
      return { success: false, error: "Données de réservation incomplètes" };
    }

    const result = await createBooking({
      coiffeur_id: draft.coiffeur.id,
      start_at: draft.start_at,
      location: draft.location,
      home_fee_cents: draft.home_fee_cents || 0,
      address_snapshot: draft.address ? {
        address_line: draft.address.address_line,
        city: draft.address.city,
        postal_code: draft.address.postal_code,
      } : undefined,
      services: [{
        service_id: draft.service.id,
        service_name: draft.service.name,
        price_cents: draft.service.price_cents,
        duration_minutes: draft.service.duration_minutes,
      }],
    });

    if (result.success && result.booking) {
      await confirmPayment(result.booking.id, `pi_simulated_${Date.now()}`);
      set((state) => ({
        bookings: [result.booking!, ...state.bookings],
        draft: {},
      }));
      return { success: true };
    }

    return { success: false, error: result.error };
  },

  loadBookings: async () => {
    set({ isLoading: true });
    const bookings = await getClientBookings();
    set({ bookings, isLoading: false });
  },

  cancelBooking: async (id, reason) => {
    const success = await apiCancelBooking(id, reason);
    if (success) {
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id
            ? { ...b, status: "cancelled" as BookingStatus, cancelled_at: new Date().toISOString() }
            : b
        ),
      }));
    }
    return success;
  },

  getUpcomingBookings: () => {
    const { bookings } = get();
    const now = new Date();
    return bookings
      .filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.start_at) > now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  },

  getPastBookings: () => {
    const { bookings } = get();
    return bookings
      .filter((b) => ["completed", "cancelled", "no_show"].includes(b.status))
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  },

  getActiveBookings: () => {
    const { bookings } = get();
    return bookings.filter((b) => ["in_progress"].includes(b.status));
  },
}));

// ============ HELPER ============

export function getDraftSummary(draft: Partial<BookingDraft>) {
  if (!draft.service) return null;
  
  const subtotal = draft.service.price_cents;
  const homeFee = draft.home_fee_cents || 0;
  const total = subtotal + homeFee;
  
  return {
    serviceName: draft.service.name,
    duration: `${draft.service.duration_minutes} min`,
    coiffeurName: draft.coiffeur?.display_name || "",
    coiffeurImage: draft.coiffeur?.avatar_url || "",
    location: draft.location || "salon",
    date: draft.date || "",
    time: draft.time || "",
    subtotalCents: subtotal,
    homeFeeCents: homeFee,
    totalCents: total,
  };
}