// app/(app)/(shared)/settings.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ROUTES } from "@/constants/routes";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

const PREFERENCES_MENU = [
  { 
    icon: "notifications-outline", 
    label: "Notifications",
    route: ROUTES.SHARED.SETTINGS.NOTIFICATIONS,
  },
  { 
    icon: "globe-outline", 
    label: "Langue",
    value: "Français",
    route: ROUTES.SHARED.SETTINGS.LANGUAGE,
  },
  { 
    icon: "moon-outline", 
    label: "Apparence",
    value: "Clair",
    route: ROUTES.SHARED.SETTINGS.APPEARANCE,
  },
];

const HELP_MENU = [
  { 
    icon: "help-circle-outline", 
    label: "Centre d'aide",
    route: ROUTES.SHARED.HELP.CENTER,
  },
  { 
    icon: "chatbubble-outline", 
    label: "Nous contacter",
    route: ROUTES.SHARED.HELP.CONTACT,
  },
  { 
    icon: "document-text-outline", 
    label: "Conditions d'utilisation",
    route: ROUTES.SHARED.LEGAL.TERMS,
  },
  { 
    icon: "shield-checkmark-outline", 
    label: "Politique de confidentialité",
    route: ROUTES.SHARED.LEGAL.PRIVACY,
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleMenuPress = (route: string) => {
    router.push(route as any);
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
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Paramètres</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Préférences Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Préférences</Text>
          <View style={styles.menuCard}>
            {PREFERENCES_MENU.map((item, index) => (
              <Pressable 
                key={index} 
                style={[
                  styles.menuItem,
                  index < PREFERENCES_MENU.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuPress(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={20} color={theme.text} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.value && <Text style={styles.menuItemValue}>{item.value}</Text>}
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Aide & Légal Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Aide & Légal</Text>
          <View style={styles.menuCard}>
            {HELP_MENU.map((item, index) => (
              <Pressable 
                key={index} 
                style={[
                  styles.menuItem,
                  index < HELP_MENU.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuPress(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={20} color={theme.text} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
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
  
  // Header
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

  // Menu Sections
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textMuted,
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    color: theme.text,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: theme.textMuted,
  },

  // Version
  version: {
    textAlign: "center",
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
  },
});