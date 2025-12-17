// stores/orderStore.ts
import { create } from "zustand";

export type OrderStatus =
  | "preparing"        // En préparation
  | "shipped"          // Expédié
  | "out_for_delivery" // En livraison
  | "delivered"        // Livré
  | "cancelled";       // Annulé

export type DeliveryMethod = "relay" | "home";

export interface OrderProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  products: OrderProduct[];
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  deliveryPrice: number;
  subtotal: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderState {
  orders: OrderItem[];
  
  // Actions
  addOrder: (order: Omit<OrderItem, "id" | "status" | "createdAt" | "updatedAt">) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  cancelOrder: (id: string) => void;
  
  // Getters
  getActiveOrders: () => OrderItem[];
  getPastOrders: () => OrderItem[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],

  addOrder: (orderData) => {
    const newOrder: OrderItem = {
      ...orderData,
      id: `order-${Date.now()}`,
      status: "preparing",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      orders: [newOrder, ...state.orders],
    }));
  },

  updateOrderStatus: (id, status) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? { ...order, status, updatedAt: new Date() }
          : order
      ),
    }));
  },

  cancelOrder: (id) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? { ...order, status: "cancelled" as const, updatedAt: new Date() }
          : order
      ),
    }));
  },

  getActiveOrders: () => {
    const { orders } = get();
    return orders.filter((o) =>
      ["preparing", "shipped", "out_for_delivery"].includes(o.status)
    );
  },

  getPastOrders: () => {
    const { orders } = get();
    return orders.filter((o) =>
      ["delivered", "cancelled"].includes(o.status)
    );
  },
}));