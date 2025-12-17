// src/stores/index.ts
// Export centralisé de tous les stores

// Auth
export { useAuthStore } from "./authStore";

// Bookings (RDV coiffeur)
export { useBookingStore } from "./bookingStore";
export type { BookingItem, BookingStatus, BookingLocation } from "./bookingStore";

// Orders (Commandes produits)
export { useOrderStore } from "./orderStore";
export type { OrderItem, OrderStatus, OrderProduct, DeliveryMethod } from "./orderStore";