// app/(app)/(shared)/notifications.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "booking",
    title: "Réservation confirmée",
    message: "Votre RDV avec Sophie Martin est confirmé pour demain à 14h",
    time: "Il y a 2h",
    read: false,
  },
  {
    id: "2",
    type: "promo",
    title: "Offre spéciale",
    message: "-20% sur votre prochaine coupe ce week-end",
    time: "Il y a 5h",
    read: false,
  },
  {
    id: "3",
    type: "reminder",
    title: "Rappel",
    message: "N'oubliez pas votre RDV demain à 10h",
    time: "Hier",
    read: true,
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case "booking": return "calendar";
      case "promo": return "pricetag";
      case "reminder": return "alarm";
      default: return "notifications";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsList}>
          {MOCK_NOTIFICATIONS.map((notif) => (
            <Pressable key={notif.id} style={[styles.notifCard, !notif.read && styles.notifCardUnread]}>
              <View style={[styles.notifIcon, !notif.read && styles.notifIconUnread]}>
                <Ionicons name={getIcon(notif.type) as any} size={20} color={!notif.read ? "#FFF" : theme.text} />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  headerSpacer: {
    width: 44,
  },
  notificationsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 16,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: "#F0F0F0",
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconUnread: {
    backgroundColor: theme.text,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.text,
    marginTop: 4,
  },
});
