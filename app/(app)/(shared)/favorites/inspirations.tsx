// app/(app)/(shared)/favorites/inspirations.tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { getFavoriteInspirations, removeInspirationFromFavorites, FavoriteInspiration } from "@/api/favorites";

const { width } = Dimensions.get("window");
const COLUMN_GAP = 8;
const PADDING = 16;
const COLUMN_WIDTH = (width - PADDING * 2 - COLUMN_GAP) / 2;

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
  error: "#EF4444",
};

export default function FavoriteInspirationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [favorites, setFavorites] = useState<FavoriteInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await getFavoriteInspirations();
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

  const handleRemoveFavorite = async (inspirationId: string) => {
    // Optimistic update
    setFavorites(prev => prev.filter(f => f.inspiration_id !== inspirationId));
    
    const success = await removeInspirationFromFavorites(inspirationId);
    if (!success) {
      // Rollback si échec
      loadFavorites();
    }
  };

  // Split into 2 columns for masonry layout
  const leftColumn: FavoriteInspiration[] = [];
  const rightColumn: FavoriteInspiration[] = [];
  favorites.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColumn.push(item);
    } else {
      rightColumn.push(item);
    }
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  const renderCard = (fav: FavoriteInspiration) => (
    <Pressable 
      key={fav.id} 
      style={styles.card}
      onPress={() => router.push(`/(app)/(shared)/inspiration/${fav.inspiration_id}`)}
    >
      <Image 
        source={{ uri: fav.inspiration?.image_url }} 
        style={[styles.cardImage, { height: Math.random() * 80 + 150 }]} 
      />
      <Pressable 
        style={styles.heartButton}
        onPress={() => handleRemoveFavorite(fav.inspiration_id!)}
      >
        <Ionicons name="heart" size={20} color={theme.error} />
      </Pressable>
      {fav.inspiration?.title && (
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={2}>{fav.inspiration.title}</Text>
        </View>
      )}
    </Pressable>
  );

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
          <Text style={styles.pageTitle}>Inspirations sauvegardées</Text>
          <View style={styles.headerSpacer} />
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>Aucune inspiration sauvegardée</Text>
            <Text style={styles.emptySubtitle}>
              Sauvegardez des inspirations pour créer votre mood board personnel
            </Text>
            <Pressable 
              style={styles.exploreButton}
              onPress={() => router.push("/(app)/(tabs)/")}
            >
              <Text style={styles.exploreButtonText}>Explorer les inspirations</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {leftColumn.map(renderCard)}
            </View>
            <View style={styles.column}>
              {rightColumn.map(renderCard)}
            </View>
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
  masonryContainer: { flexDirection: "row", paddingHorizontal: PADDING, gap: COLUMN_GAP },
  column: { flex: 1, gap: COLUMN_GAP },
  card: { backgroundColor: theme.card, borderRadius: 16, overflow: "hidden", position: "relative" },
  cardImage: { width: "100%", resizeMode: "cover" },
  heartButton: { position: "absolute", top: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  cardFooter: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "500", color: theme.text },
  emptyState: { alignItems: "center", paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: theme.textMuted, textAlign: "center", marginTop: 8 },
  exploreButton: { marginTop: 24, backgroundColor: theme.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreButtonText: { color: theme.background, fontSize: 14, fontWeight: "600" },
});