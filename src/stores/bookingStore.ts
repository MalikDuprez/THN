// stores/bookingStore.ts
import { create } from "zustand";

export type BookingStatus =
  | "pending"            // En attente de confirmation
  | "confirmed"          // Confirmé (À venir)
  | "hairdresser_coming" // Coiffeur en route (En cours)
  | "in_progress"        // Prestation en cours (En cours)
  | "completed"          // Terminé (Passées)
  | "cancelled";         // Annulé (Passées)

export type BookingLocation = "salon" | "domicile";

export interface BookingItem {
  id: string;
  inspiration: {
    id: string;
    title: string;
    image: string;
    category: string;
    duration: string;
    price: number;
  };
  coiffeur: {
    id: string;
    name: string;
    salon: string;
    image: string;
    rating: number;
    phone?: string;
  };
  date: string;           // Format ISO pour tri
  dateFormatted: string;  // Format affichage "15 Jan 2025"
  time: string;           // "14:30"
  location: BookingLocation;
  address?: string;       // Adresse si domicile, ou adresse du salon
  serviceFee?: number;    // Frais de déplacement si domicile
  status: BookingStatus;
  rated?: boolean;        // A été noté ?
  createdAt: Date;
  updatedAt: Date;
}

interface BookingState {
  // Réservation en cours de création (pendant le flow checkout)
  currentBooking: Omit<BookingItem, "id" | "status" | "rated" | "createdAt" | "updatedAt"> | null;
  
  // Toutes les réservations
  bookings: BookingItem[];
  
  // Actions
  setCurrentBooking: (booking: Omit<BookingItem, "id" | "status" | "rated" | "createdAt" | "updatedAt">) => void;
  clearCurrentBooking: () => void;
  confirmBooking: () => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  rateBooking: (id: string) => void;
  
  // Getters pour les onglets
  getActiveBookings: () => BookingItem[];    // En cours (coiffeur en route ou prestation)
  getUpcomingBookings: () => BookingItem[];  // À venir (confirmé ou pending)
  getPastBookings: () => BookingItem[];      // Passées (terminé ou annulé)
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentBooking: null,
  bookings: [],

  setCurrentBooking: (booking) => {
    set({ currentBooking: booking });
  },

  clearCurrentBooking: () => {
    set({ currentBooking: null });
  },

  confirmBooking: () => {
    const { currentBooking, bookings } = get();
    if (currentBooking) {
      const newBooking: BookingItem = {
        ...currentBooking,
        id: `booking-${Date.now()}`,
        status: "confirmed",
        rated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set({
        bookings: [newBooking, ...bookings],
        currentBooking: null,
      });
    }
  },

  updateBookingStatus: (id, status) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, status, updatedAt: new Date() }
          : b
      ),
    }));
  },

  cancelBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, status: "cancelled" as const, updatedAt: new Date() }
          : b
      ),
    }));
  },

  rateBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, rated: true, updatedAt: new Date() }
          : b
      ),
    }));
  },

  getActiveBookings: () => {
    const { bookings } = get();
    return bookings.filter((b) =>
      ["hairdresser_coming", "in_progress"].includes(b.status)
    );
  },

  getUpcomingBookings: () => {
    const { bookings } = get();
    return bookings
      .filter((b) => ["pending", "confirmed"].includes(b.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getPastBookings: () => {
    const { bookings } = get();
    return bookings
      .filter((b) => ["completed", "cancelled"].includes(b.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
}));