// app/(app)/(shared)/favorites/inspirations.tsx
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { INSPIRATIONS } from "@/constants/mockData";
import { ROUTES } from "@/constants/routes";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textMuted: "#999999",
  card: "#F5F5F5",
};

export default function FavoriteInspirationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const favorites = INSPIRATIONS.slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Inspirations sauvegardées</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.grid}>
          {favorites.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => router.push(ROUTES.SHARED.INSPIRATION(item.id))}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Pressable style={styles.heartButton}>
                <Ionicons name="heart" size={18} color="#E53935" />
              </Pressable>
              <View style={styles.cardFooter}>
                <Text style={styles.category}>{item.category}</Text>
              </View>
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
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  card: { width: CARD_WIDTH, borderRadius: 16, overflow: "hidden", backgroundColor: theme.card },
  image: { width: "100%", height: CARD_WIDTH * 1.3 },
  heartButton: { position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  cardFooter: { padding: 12 },
  category: { fontSize: 13, color: theme.textMuted },
});
