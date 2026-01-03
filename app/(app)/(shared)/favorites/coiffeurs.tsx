// app/(app)/(shared)/favorites/coiffeurs.tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getFavoriteCoiffeurs, removeCoiffeurFromFavorites, FavoriteCoiffeur } from "@/api/favorites";
import { ROUTES } from "@/constants/routes";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
  error: "#EF4444",
};

export default function FavoriteCoiffeursScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [favorites, setFavorites] = useState<FavoriteCoiffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await getFavoriteCoiffeurs();
      setFavorites(data);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRemoveFavorite = async (coiffeurId: string) => {
    // Optimistic update
    setFavorites(prev => prev.filter(f => f.coiffeur_id !== coiffeurId));
    
    const success = await removeCoiffeurFromFavorites(coiffeurId);
    if (!success) {
      // Rollback si échec
      loadFavorites();
    }
  };

  const getCoiffeurName = (fav: FavoriteCoiffeur) => {
    const profile = fav.coiffeur?.profile;
    if (!profile) return "Coiffeur";
    return profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Coiffeur";
  };

  const getCoiffeurAvatar = (fav: FavoriteCoiffeur) => {
    return fav.coiffeur?.profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Coiffeurs favoris</Text>
          <View style={styles.headerSpacer} />
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>Aucun coiffeur favori</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez des coiffeurs à vos favoris pour les retrouver facilement
            </Text>
            <Pressable 
              style={styles.exploreButton}
              onPress={() => router.push("/(app)/(tabs)/")}
            >
              <Text style={styles.exploreButtonText}>Explorer les coiffeurs</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {favorites.map((fav) => (
              <Pressable 
                key={fav.id} 
                style={styles.card} 
                onPress={() => router.push(ROUTES.SHARED.COIFFEUR(fav.coiffeur_id!))}
              >
                <Image source={{ uri: getCoiffeurAvatar(fav) }} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={styles.name}>{getCoiffeurName(fav)}</Text>
                  <Text style={styles.specialty}>{fav.coiffeur?.specialty || "Coiffure"}</Text>
                  {fav.coiffeur?.rating && (
                    <View style={styles.rating}>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={styles.ratingText}>{fav.coiffeur.rating.toFixed(1)}</Text>
                      {fav.coiffeur.reviews_count > 0 && (
                        <Text style={styles.reviewsCount}>({fav.coiffeur.reviews_count})</Text>
                      )}
                    </View>
                  )}
                </View>
                <Pressable 
                  style={styles.heartButton}
                  onPress={() => handleRemoveFavorite(fav.coiffeur_id!)}
                >
                  <Ionicons name="heart" size={22} color={theme.error} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontWeight: "600", color: theme.text },
  headerSpacer: { width: 44 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 16, padding: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: "600", color: theme.text },
  specialty: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: "500", color: theme.text },
  reviewsCount: { fontSize: 12, color: theme.textMuted },
  heartButton: { padding: 8 },
  emptyState: { alignItems: "center", paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: theme.textMuted, textAlign: "center", marginTop: 8 },
  exploreButton: { marginTop: 24, backgroundColor: theme.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreButtonText: { color: theme.background, fontSize: 14, fontWeight: "600" },
});