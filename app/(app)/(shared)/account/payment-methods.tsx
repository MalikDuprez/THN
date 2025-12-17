// app/(app)/(shared)/account/payment-methods.tsx
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

const MOCK_CARDS = [
  { id: "1", type: "visa", last4: "4242", expiry: "12/26", isDefault: true },
  { id: "2", type: "mastercard", last4: "8888", expiry: "03/25", isDefault: false },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getCardIcon = (type: string) => type === "visa" ? "card" : "card-outline";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Moyens de paiement</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.cardsList}>
          {MOCK_CARDS.map((card) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={getCardIcon(card.type) as any} size={24} color={theme.text} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardExpiry}>Expire {card.expiry}</Text>
              </View>
              {card.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Par défaut</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Pressable style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.text} />
          <Text style={styles.addButtonText}>Ajouter une carte</Text>
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
  cardsList: { paddingHorizontal: 20, gap: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 16, padding: 16 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardNumber: { fontSize: 16, fontWeight: "600", color: theme.text },
  cardExpiry: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  defaultBadge: { backgroundColor: theme.text, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  defaultText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, backgroundColor: theme.card, borderRadius: 14 },
  addButtonText: { fontSize: 15, fontWeight: "600", color: theme.text },
});
