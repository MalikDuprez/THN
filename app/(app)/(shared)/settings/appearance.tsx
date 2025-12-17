// app/(app)/(shared)/settings/appearance.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

const THEMES = [
  { id: "light", label: "Clair", icon: "sunny-outline" },
  { id: "dark", label: "Sombre", icon: "moon-outline" },
  { id: "auto", label: "Automatique", icon: "phone-portrait-outline" },
];

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState("light");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Apparence</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionTitle}>Thème</Text>
        <View style={styles.menuCard}>
          {THEMES.map((t, i) => (
            <Pressable key={t.id} style={[styles.menuItem, i > 0 && styles.menuItemBorder]} onPress={() => setSelected(t.id)}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={t.icon as any} size={20} color={theme.text} />
                </View>
                <Text style={styles.menuItemLabel}>{t.label}</Text>
              </View>
              {selected === t.id && <Ionicons name="checkmark-circle" size={24} color={theme.text} />}
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
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginLeft: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  menuCard: { backgroundColor: theme.card, marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  menuItemLabel: { fontSize: 15, color: theme.text, fontWeight: "500" },
});
