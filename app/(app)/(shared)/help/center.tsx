// app/(app)/(shared)/help/center.tsx
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
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

const FAQ = [
  { q: "Comment réserver un RDV ?", a: "Parcourez les inspirations ou recherchez un coiffeur, puis sélectionnez un créneau disponible." },
  { q: "Comment annuler une réservation ?", a: "Allez dans Activité, trouvez votre RDV et appuyez sur Annuler. Gratuit jusqu'à 24h avant." },
  { q: "Comment devenir coiffeur sur TapeHair ?", a: "Créez un compte et sélectionnez 'Coiffeur' lors de l'inscription pour accéder au mode Pro." },
  { q: "Les paiements sont-ils sécurisés ?", a: "Oui, tous les paiements sont sécurisés via Stripe avec cryptage SSL." },
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = FAQ.filter(f => f.q.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Centre d'aide</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color={theme.textMuted} />
            <TextInput style={styles.searchTextInput} placeholder="Rechercher une question..." placeholderTextColor={theme.textMuted} value={search} onChangeText={setSearch} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        <View style={styles.faqList}>
          {filtered.map((item, i) => (
            <Pressable key={i} style={styles.faqCard} onPress={() => setExpanded(expanded === i ? null : i)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons name={expanded === i ? "chevron-up" : "chevron-down"} size={20} color={theme.textMuted} />
              </View>
              {expanded === i && <Text style={styles.faqAnswer}>{item.a}</Text>}
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
  searchContainer: { paddingHorizontal: 20, marginBottom: 24 },
  searchInput: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 14, height: 48 },
  searchTextInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: theme.textMuted, marginLeft: 20, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  faqList: { paddingHorizontal: 20, gap: 12 },
  faqCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600", color: theme.text, marginRight: 12 },
  faqAnswer: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginTop: 12 },
});
