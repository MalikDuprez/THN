// app/(app)/(shared)/legal/terms.tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  card: "#F5F5F5",
};

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Conditions d'utilisation</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdate}>Dernière mise à jour : Janvier 2025</Text>
          
          <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>En utilisant TapeHair, vous acceptez les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</Text>

          <Text style={styles.sectionTitle}>2. Description du service</Text>
          <Text style={styles.paragraph}>TapeHair est une plateforme de mise en relation entre clients et professionnels de la coiffure. Nous facilitons la prise de rendez-vous mais ne sommes pas responsables des prestations effectuées.</Text>

          <Text style={styles.sectionTitle}>3. Inscription et compte</Text>
          <Text style={styles.paragraph}>Vous devez fournir des informations exactes lors de votre inscription. Vous êtes responsable de la confidentialité de vos identifiants de connexion.</Text>

          <Text style={styles.sectionTitle}>4. Réservations et paiements</Text>
          <Text style={styles.paragraph}>Les réservations sont fermes une fois confirmées. Les annulations sont gratuites jusqu'à 24h avant le rendez-vous. Au-delà, des frais peuvent s'appliquer.</Text>

          <Text style={styles.sectionTitle}>5. Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>Tous les contenus de l'application (logos, textes, images) sont protégés par le droit d'auteur et restent la propriété de TapeHair.</Text>
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
  content: { paddingHorizontal: 20 },
  lastUpdate: { fontSize: 12, color: theme.textMuted, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: theme.text, marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
});
