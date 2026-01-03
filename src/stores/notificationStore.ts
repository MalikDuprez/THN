// src/stores/notificationStore.ts
import { create } from "zustand";
import { 
  getUnreadCount, 
  getUnreadCountAsClient,
  getUnreadCountAsCoiffeur,
  subscribeToNotifications,
  resetNotificationSubscription,
} from "@/api/notifications";
import type { Notification } from "@/types/database";

interface NotificationState {
  // Compteurs
  unreadCount: number;           // Total (pour compatibilité)
  clientUnreadCount: number;     // Notifications client
  coiffeurUnreadCount: number;   // Notifications coiffeur
  
  // Dernière notification reçue
  lastNotification: Notification | null;
  
  // État de la subscription
  isSubscribed: boolean;

  // Actions
  fetchUnreadCount: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
  resetClientCount: () => void;
  resetCoiffeurCount: () => void;
  setLastNotification: (notification: Notification) => void;
  setupRealtimeSubscription: () => void;
  cleanup: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  clientUnreadCount: 0,
  coiffeurUnreadCount: 0,
  lastNotification: null,
  isSubscribed: false,

  // Récupérer le compteur total (legacy)
  fetchUnreadCount: async () => {
    console.log("📊 Fetching total unread count...");
    const count = await getUnreadCount();
    console.log("📊 Total unread count:", count);
    set({ unreadCount: count });
  },

  // Récupérer les compteurs séparés (client + coiffeur)
  fetchUnreadCounts: async () => {
    console.log("📊 Fetching unread counts (client + coiffeur)...");
    const [clientCount, coiffeurCount] = await Promise.all([
      getUnreadCountAsClient(),
      getUnreadCountAsCoiffeur(),
    ]);
    console.log("📊 Client unread:", clientCount, "| Coiffeur unread:", coiffeurCount);
    set({ 
      clientUnreadCount: clientCount, 
      coiffeurUnreadCount: coiffeurCount,
      unreadCount: clientCount + coiffeurCount,
    });
  },

  incrementCount: () => {
    set((state) => {
      const newCount = state.unreadCount + 1;
      console.log("📊 Incrementing total count to:", newCount);
      return { unreadCount: newCount };
    });
  },

  decrementCount: () => {
    set((state) => {
      const newCount = Math.max(0, state.unreadCount - 1);
      console.log("📊 Decrementing total count to:", newCount);
      return { unreadCount: newCount };
    });
  },

  resetCount: () => {
    console.log("📊 Resetting all counts to 0");
    set({ unreadCount: 0, clientUnreadCount: 0, coiffeurUnreadCount: 0 });
  },

  resetClientCount: () => {
    console.log("📊 Resetting client count to 0");
    set((state) => ({ 
      clientUnreadCount: 0,
      unreadCount: state.coiffeurUnreadCount, 
    }));
  },

  resetCoiffeurCount: () => {
    console.log("📊 Resetting coiffeur count to 0");
    set((state) => ({ 
      coiffeurUnreadCount: 0,
      unreadCount: state.clientUnreadCount,
    }));
  },

  setLastNotification: (notification: Notification) => {
    console.log("📊 Setting last notification:", notification.title);
    set({ lastNotification: notification });
  },

  setupRealtimeSubscription: () => {
    // Si déjà abonné, ne rien faire
    if (get().isSubscribed) {
      console.log("📊 Already subscribed to realtime notifications");
      return;
    }

    console.log("📊 Setting up realtime subscription...");
    set({ isSubscribed: true });

    subscribeToNotifications((notification) => {
      // Nouvelle notification reçue
      console.log("🔔 Nouvelle notification reçue via realtime:", notification.title);
      
      // Rafraîchir les compteurs séparés pour être précis
      get().fetchUnreadCounts();
      
      // Stocker la dernière notification
      set({ lastNotification: notification });
    });
    
    // La subscription reste active pour toute la durée de vie de l'app
  },

  cleanup: () => {
    console.log("📊 Cleaning up notification store");
    resetNotificationSubscription();
    set({ 
      isSubscribed: false, 
      unreadCount: 0, 
      clientUnreadCount: 0, 
      coiffeurUnreadCount: 0,
      lastNotification: null,
    });
  },
}));