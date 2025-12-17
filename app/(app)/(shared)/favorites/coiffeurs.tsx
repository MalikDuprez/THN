// app/(app)/(shared)/favorites/coiffeurs.tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COIFFEURS } from "@/constants/mockData";
import { ROUTES } from "@/constants/routes";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

export default function FavoriteCoiffeursScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const favorites = COIFFEURS.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Coiffeurs favoris</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.list}>
          {favorites.map((coiffeur) => (
            <Pressable key={coiffeur.id} style={styles.card} onPress={() => router.push(ROUTES.SHARED.COIFFEUR(coiffeur.id))}>
              <Image source={{ uri: coiffeur.avatar }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{coiffeur.name}</Text>
                <Text style={styles.salon}>{coiffeur.salon}</Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.ratingText}>{coiffeur.rating}</Text>
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
  avatar: { width: 56, height: 56, borderRadius: 28 },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: "600", color: theme.text },
  salon: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: "500", color: theme.text },
  heartButton: { padding: 8 },
});
