// app/(app)/(pro)/settings-pro.tsx
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { ROUTES } from "@/constants/routes";

// ============================================
// THEME
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#3B82F6",
  accentLight: "#EFF6FF",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
  background: "#F1F5F9",
};

// ============================================
// COMPOSANTS
// ============================================
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingItem = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  isSwitch, 
  switchValue, 
  onSwitchChange,
  danger,
  chevron = true,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
  chevron?: boolean;
}) => (
  <Pressable 
    style={[styles.settingItem, danger && styles.settingItemDanger]} 
    onPress={onPress} 
    disabled={isSwitch}
  >
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconContainer, danger && styles.settingIconDanger]}>
        <Ionicons name={icon as any} size={20} color={danger ? theme.error : theme.accent} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
    </View>
    {isSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: theme.border, true: theme.accentLight }}
        thumbColor={switchValue ? theme.accent : theme.textMuted}
      />
    ) : (
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {chevron && <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />}
      </View>
    )}
  </Pressable>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function SettingsProScreen() {
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [instantBooking, setInstantBooking] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Déconnexion", style: "destructive", onPress: () => router.replace(ROUTES.AUTH.LOGIN) },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => console.log("Delete account") },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenu */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="notifications-outline"
            label="Notifications push"
            isSwitch
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
          <SettingItem
            icon="mail-outline"
            label="Notifications email"
            isSwitch
            switchValue={emailNotifications}
            onSwitchChange={setEmailNotifications}
          />
          <SettingItem
            icon="chatbubble-outline"
            label="Notifications SMS"
            isSwitch
            switchValue={smsNotifications}
            onSwitchChange={setSmsNotifications}
          />
        </View>

        {/* Réservations */}
        <SectionHeader title="RÉSERVATIONS" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="flash-outline"
            label="Réservation instantanée"
            isSwitch
            switchValue={instantBooking}
            onSwitchChange={setInstantBooking}
          />
          <SettingItem
            icon="checkmark-done-outline"
            label="Acceptation automatique"
            isSwitch
            switchValue={autoAccept}
            onSwitchChange={setAutoAccept}
          />
          <SettingItem
            icon="time-outline"
            label="Délai d'annulation"
            value="24h"
            onPress={() => {}}
          />
          <SettingItem
            icon="calendar-outline"
            label="Réservation à l'avance"
            value="30 jours"
            onPress={() => {}}
          />
        </View>

        {/* Confidentialité */}
        <SectionHeader title="CONFIDENTIALITÉ" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="eye-outline"
            label="Afficher statut en ligne"
            isSwitch
            switchValue={showOnlineStatus}
            onSwitchChange={setShowOnlineStatus}
          />
          <SettingItem
            icon="location-outline"
            label="Partage de position"
            value="Activé"
            onPress={() => {}}
          />
          <SettingItem
            icon="lock-closed-outline"
            label="Mot de passe"
            onPress={() => {}}
          />
        </View>

        {/* Paiements */}
        <SectionHeader title="PAIEMENTS" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="card-outline"
            label="Moyens de paiement"
            value="•••• 4242"
            onPress={() => {}}
          />
          <SettingItem
            icon="wallet-outline"
            label="Compte bancaire"
            value="Configuré"
            onPress={() => {}}
          />
          <SettingItem
            icon="receipt-outline"
            label="Historique des transactions"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text-outline"
            label="Factures"
            onPress={() => {}}
          />
        </View>

        {/* Aide */}
        <SectionHeader title="AIDE" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="help-circle-outline"
            label="Centre d'aide"
            onPress={() => {}}
          />
          <SettingItem
            icon="chatbubbles-outline"
            label="Contacter le support"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-outline"
            label="Conditions d'utilisation"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-outline"
            label="Politique de confidentialité"
            onPress={() => {}}
          />
        </View>

        {/* Compte */}
        <SectionHeader title="COMPTE" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="swap-horizontal-outline"
            label="Passer en mode Client"
            onPress={() => router.replace(ROUTES.CLIENT.HOME)}
          />
          <SettingItem
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleLogout}
            danger
            chevron={false}
          />
          <SettingItem
            icon="trash-outline"
            label="Supprimer mon compte"
            onPress={handleDeleteAccount}
            danger
            chevron={false}
          />
        </View>

        <Text style={styles.versionText}>TapeHair Pro v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  // Header
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: theme.text },
  placeholder: { width: 40 },

  // Content
  content: { flex: 1 },

  // Section Header
  sectionHeader: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: theme.textMuted, 
    marginTop: 24, 
    marginBottom: 8, 
    marginLeft: 20,
    letterSpacing: 0.5,
  },

  // Settings Card
  settingsCard: { 
    marginHorizontal: 16, 
    backgroundColor: theme.white, 
    borderRadius: 16, 
    overflow: "hidden",
  },
  settingItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
  },
  settingItemDanger: {},
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: theme.accentLight, 
    alignItems: "center", 
    justifyContent: "center",
  },
  settingIconDanger: { backgroundColor: theme.errorLight },
  settingLabel: { fontSize: 15, color: theme.text },
  settingLabelDanger: { color: theme.error },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { fontSize: 14, color: theme.textMuted },

  // Version
  versionText: { 
    textAlign: "center", 
    fontSize: 12, 
    color: theme.textMuted, 
    marginTop: 24,
    marginBottom: 20,
  },
});