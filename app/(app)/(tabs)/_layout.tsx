// app/(app)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { createContext, useContext, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LiquidGlassTabBar } from "@layout";

// Scroll Context
interface ScrollContextType {
  isScrolling: boolean;
  setIsScrolling: (value: boolean) => void;
}

export const ScrollContext = createContext<ScrollContextType>({
  isScrolling: false,
  setIsScrolling: () => {},
});

export const useScrollContext = () => useContext(ScrollContext);

// Cart Context
interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
  deliveryOption: string;
  deliveryFee: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'> & { productId: string }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartTotal: 0,
});

export const useCartContext = () => useContext(CartContext);

export default function TabsLayout() {
  const [isScrolling, setIsScrolling] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Calculs du panier
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity) + item.deliveryFee, 
    0
  );

  // Fonctions du panier
  const addToCart = (item: Omit<CartItem, 'id'> & { productId: string }) => {
    const cartItemId = `${item.productId}-${item.deliveryOption}`;
    const existingIndex = cartItems.findIndex(i => i.id === cartItemId);

    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += item.quantity;
      setCartItems(newItems);
    } else {
      setCartItems([...cartItems, { ...item, id: cartItemId }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <ScrollContext.Provider value={{ isScrolling, setIsScrolling }}>
      <CartContext.Provider value={{ 
        cartItems, 
        addToCart, 
        updateQuantity, 
        removeItem, 
        clearCart,
        cartCount,
        cartTotal,
      }}>
        <StatusBar style="dark" />
        <Tabs
          tabBar={(props) => <LiquidGlassTabBar {...props} isScrolling={isScrolling} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="salon" />
          <Tabs.Screen name="activity" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </CartContext.Provider>
    </ScrollContext.Provider>
  );
}