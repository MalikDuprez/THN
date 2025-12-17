// app/(app)/(shared)/settings/language.tsx
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

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export default function LanguageSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState("fr");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Langue</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.menuCard}>
          {LANGUAGES.map((lang, i) => (
            <Pressable key={lang.code} style={[styles.menuItem, i > 0 && styles.menuItemBorder]} onPress={() => setSelected(lang.code)}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.menuItemLabel}>{lang.label}</Text>
              </View>
              {selected === lang.code && <Ionicons name="checkmark-circle" size={24} color={theme.text} />}
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
  menuCard: { backgroundColor: theme.card, marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuItemLabel: { fontSize: 15, color: theme.text, fontWeight: "500" },
  flag: { fontSize: 24 },
});
