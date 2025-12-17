// app/(app)/(shared)/settings/notifications.tsx
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Général</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Notifications push</Text>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: "#000" }} />
            </View>
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Text style={styles.menuItemLabel}>Notifications email</Text>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: "#000" }} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de notifications</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemLabel}>Rappels de RDV</Text>
              <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: "#000" }} />
            </View>
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <Text style={styles.menuItemLabel}>Offres promotionnelles</Text>
              <Switch value={promoEnabled} onValueChange={setPromoEnabled} trackColor={{ true: "#000" }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollView: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontWeight: "600", color: theme.text },
  headerSpacer: { width: 44 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginLeft: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  menuCard: { backgroundColor: theme.card, marginHorizontal: 20, borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  menuItemLabel: { fontSize: 15, color: theme.text, fontWeight: "500" },
});
