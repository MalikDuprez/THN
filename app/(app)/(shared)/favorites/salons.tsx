// app/(app)/(shared)/favorites/salons.tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  card: "#F5F5F5",
};

const MOCK_SALONS = [
  { id: "1", name: "L'Atelier Coiffure", address: "12 rue de la Paix, Paris", rating: 4.8, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200" },
  { id: "2", name: "Hair Studio Premium", address: "45 av. des Champs-Élysées, Paris", rating: 4.9, image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200" },
  { id: "3", name: "Salon Élégance", address: "8 bd Haussmann, Paris", rating: 4.7, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200" },
];

export default function FavoriteSalonsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Salons favoris</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.list}>
          {MOCK_SALONS.map((salon) => (
            <Pressable key={salon.id} style={styles.card}>
              <Image source={{ uri: salon.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>{salon.name}</Text>
                <Text style={styles.address}>{salon.address}</Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.ratingText}>{salon.rating}</Text>
                </View>
              </View>
              <Pressable style={styles.heartButton}>
                <Ionicons name="heart" size={22} color="#E53935" />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontWeight: "600", color: theme.text },
  headerSpacer: { width: 44 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 16, padding: 14 },
  image: { width: 64, height: 64, borderRadius: 12 },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: "600", color: theme.text },
  address: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  ratingText: { fontSize: 13, fontWeight: "500", color: theme.text },
  heartButton: { padding: 8 },
});
