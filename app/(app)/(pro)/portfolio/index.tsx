// app/(app)/(pro)/portfolio/index.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ROUTES } from "@/constants/routes";

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Mon portfolio</Text>
        <Pressable 
          onPress={() => router.push(ROUTES.PRO.PORTFOLIO_ADD)} 
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#000" />
        </Pressable>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="images-outline" size={60} color="#DDD" />
        <Text style={styles.placeholderText}>Portfolio en cours de développement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "600", color: "#000" },
  addButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  placeholderText: { fontSize: 16, color: "#999" },
});
