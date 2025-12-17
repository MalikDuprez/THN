// src/types/index.ts

// Types utilisateur
export type UserRole = "client" | "coiffeur" | "salon" | null;

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
}

// Types coiffeur
export interface Coiffeur {
  id: string;
  name: string;
  salon: string;
  image: string;
  rating: number;
  reviews: number;
  specialty: string;
  distance: string;
  services: Service[];
  photos: string[];
}

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
}

// Types réservation
export interface Booking {
  id: string;
  client_id: string;
  coiffeur_id: string;
  service_id: string;
  date: string;
  time: string;
  status: BookingStatus;
  location_type: "salon" | "domicile";
  total_price: number;
  created_at: Date;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

// Types inspiration
export interface Inspiration {
  id: string;
  title: string;
  image: string;
  category: string;
  duration: string;
  price: number;
}
