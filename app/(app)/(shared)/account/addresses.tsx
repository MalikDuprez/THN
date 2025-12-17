// app/(app)/(shared)/account/addresses.tsx
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

const MOCK_ADDRESSES = [
  { id: "1", label: "Domicile", address: "12 rue de la Paix", city: "75002 Paris", isDefault: true },
  { id: "2", label: "Bureau", address: "45 avenue des Champs-Élysées", city: "75008 Paris", isDefault: false },
];

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Adresses enregistrées</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.addressList}>
          {MOCK_ADDRESSES.map((addr) => (
            <View key={addr.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={addr.label === "Domicile" ? "home" : "business"} size={20} color={theme.text} />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{addr.label}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Par défaut</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.address}>{addr.address}</Text>
                <Text style={styles.city}>{addr.city}</Text>
              </View>
              <Pressable style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.text} />
          <Text style={styles.addButtonText}>Ajouter une adresse</Text>
        </Pressable>
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
  addressList: { paddingHorizontal: 20, gap: 12 },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: theme.card, borderRadius: 16, padding: 16 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, marginLeft: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 15, fontWeight: "600", color: theme.text },
  defaultBadge: { backgroundColor: theme.text, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultText: { color: "#FFF", fontSize: 10, fontWeight: "600" },
  address: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  city: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  editButton: { padding: 8 },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, backgroundColor: theme.card, borderRadius: 14 },
  addButtonText: { fontSize: 15, fontWeight: "600", color: theme.text },
});
