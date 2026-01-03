// src/components/shared/NotificationBell.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  ViewStyle,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationStore } from "@/stores/notificationStore";

interface NotificationBellProps {
  size?: number;
  color?: string;
  showBadge?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function NotificationBell({
  size = 24,
  color = "#000",
  showBadge = true,
  onPress,
  style,
}: NotificationBellProps) {
  const router = useRouter();
  const { 
    unreadCount, 
    fetchUnreadCounts, 
    lastNotification,
  } = useNotificationStore();
  
  // État pour savoir si on affiche le nombre ou juste le point
  const [showNumber, setShowNumber] = useState(true);
  
  // Animation pour la transition
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation de "shake" quand une nouvelle notification arrive
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Charger les compteurs au montage
  useEffect(() => {
    fetchUnreadCounts();
  }, []);

  // Re-fetch quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCounts();
    }, [])
  );

  // Animation quand une nouvelle notification arrive
  useEffect(() => {
    if (lastNotification) {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      
      // Reset showNumber pour afficher le nombre
      setShowNumber(true);
      scaleAnim.setValue(1);
    }
  }, [lastNotification]);

  // Timer pour passer du nombre au point après 5 secondes
  useEffect(() => {
    if (unreadCount > 0 && showNumber) {
      const timer = setTimeout(() => {
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setShowNumber(false);
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }).start();
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [unreadCount, showNumber]);

  // Réinitialiser quand le compteur change
  useEffect(() => {
    if (unreadCount > 0) {
      setShowNumber(true);
      scaleAnim.setValue(1);
    }
  }, [unreadCount]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(app)/(shared)/notifications");
    }
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <Ionicons name="notifications-outline" size={size} color={color} />
      </Animated.View>

      {showBadge && unreadCount > 0 && (
        <Animated.View
          style={[
            showNumber ? styles.badgeWithNumber : styles.badgeDot,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {showNumber && (
            <Text style={styles.badgeText}>{displayCount}</Text>
          )}
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

// Version pour utilisation dans les tabs (badge séparé)
interface NotificationBadgeProps {
  count: number;
  size?: "small" | "medium";
  animated?: boolean;
}

export function NotificationBadge({
  count,
  size = "medium",
  animated = true,
}: NotificationBadgeProps) {
  const [showNumber, setShowNumber] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count > 0 && showNumber && animated) {
      const timer = setTimeout(() => {
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setShowNumber(false);
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }).start();
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [count, showNumber, animated]);

  useEffect(() => {
    if (count > 0) {
      setShowNumber(true);
      scaleAnim.setValue(1);
    }
  }, [count]);

  if (count <= 0) return null;

  const isSmall = size === "small";

  return (
    <Animated.View
      style={[
        showNumber
          ? [styles.tabBadgeNumber, isSmall && styles.tabBadgeSmall]
          : [styles.tabBadgeDot, isSmall && styles.tabBadgeDotSmall],
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {showNumber && (
        <Text style={[styles.tabBadgeText, isSmall && styles.tabBadgeTextSmall]}>
          {count > 99 ? "99+" : count}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  // Badge avec nombre (sur la cloche)
  badgeWithNumber: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  // Point rouge simple (sur la cloche)
  badgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  // Badge pour les tabs - avec nombre
  tabBadgeNumber: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabBadgeSmall: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  // Badge pour les tabs - point
  tabBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  tabBadgeDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  tabBadgeTextSmall: {
    fontSize: 9,
  },
});

export default NotificationBell;