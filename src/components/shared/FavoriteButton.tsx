// src/components/shared/FavoriteButton.tsx
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  isCoiffeurFavorite, 
  toggleCoiffeurFavorite,
  isInspirationFavorite,
  toggleInspirationFavorite 
} from "@/api/favorites";

interface FavoriteButtonProps {
  type: "coiffeur" | "inspiration";
  itemId: string;
  size?: number;
  style?: ViewStyle;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ 
  type, 
  itemId, 
  size = 22,
  style,
  onToggle 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [itemId, type]);

  const checkFavorite = async () => {
    setLoading(true);
    try {
      const result = type === "coiffeur" 
        ? await isCoiffeurFavorite(itemId)
        : await isInspirationFavorite(itemId);
      setIsFavorite(result);
    } catch (error) {
      console.error("Error checking favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (toggling) return;
    
    setToggling(true);
    
    // Optimistic update
    const newState = !isFavorite;
    setIsFavorite(newState);
    
    try {
      const success = type === "coiffeur"
        ? await toggleCoiffeurFavorite(itemId)
        : await toggleInspirationFavorite(itemId);
      
      if (success) {
        onToggle?.(newState);
      } else {
        // Rollback
        setIsFavorite(!newState);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Rollback
      setIsFavorite(!newState);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Pressable style={[styles.button, style]}>
        <ActivityIndicator size="small" color="#999" />
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={[styles.button, style]}
      onPress={handleToggle}
      disabled={toggling}
    >
      <Ionicons 
        name={isFavorite ? "heart" : "heart-outline"} 
        size={size} 
        color={isFavorite ? "#EF4444" : "#666"} 
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});