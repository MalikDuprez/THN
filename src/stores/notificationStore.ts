// src/stores/notificationStore.ts
import { create } from "zustand";
import { getUnreadCount, subscribeToNotifications } from "@/api/notifications";
import type { Notification } from "@/types/database";

interface NotificationState {
  unreadCount: number;
  lastNotification: Notification | null;
  isSubscribed: boolean;

  // Actions
  fetchUnreadCount: () => Promise<void>;
  incrementCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
  setLastNotification: (notification: Notification) => void;
  setupRealtimeSubscription: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  lastNotification: null,
  isSubscribed: false,

  fetchUnreadCount: async () => {
    console.log("📊 Fetching unread count from API...");
    const count = await getUnreadCount();
    console.log("📊 Unread count from API:", count);
    set({ unreadCount: count });
  },

  incrementCount: () => {
    set((state) => {
      const newCount = state.unreadCount + 1;
      console.log("📊 Incrementing count to:", newCount);
      return { unreadCount: newCount };
    });
  },

  decrementCount: () => {
    set((state) => {
      const newCount = Math.max(0, state.unreadCount - 1);
      console.log("📊 Decrementing count to:", newCount);
      return { unreadCount: newCount };
    });
  },

  resetCount: () => {
    console.log("📊 Resetting count to 0");
    set({ unreadCount: 0 });
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
      set((state) => ({
        unreadCount: state.unreadCount + 1,
        lastNotification: notification,
      }));
    });
    
    // La subscription reste active pour toute la durée de vie de l'app
  },
}));