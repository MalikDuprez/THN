// app/(app)/(pro)/services/[id].tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function EditServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Éditer le service</Text>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="create-outline" size={60} color="#DDD" />
        <Text style={styles.placeholderText}>Édition service #{id}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  placeholderText: { fontSize: 16, color: "#999" },
});
