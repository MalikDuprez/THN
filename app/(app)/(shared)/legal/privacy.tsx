// app/(app)/(shared)/legal/privacy.tsx
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

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Politique de confidentialité</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.lastUpdate}>Dernière mise à jour : Janvier 2025</Text>
          
          <Text style={styles.sectionTitle}>1. Données collectées</Text>
          <Text style={styles.paragraph}>Nous collectons les données nécessaires au fonctionnement du service : nom, email, téléphone, historique de réservations, et données de paiement (traitées par Stripe).</Text>

          <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
          <Text style={styles.paragraph}>Vos données sont utilisées pour gérer votre compte, traiter vos réservations, vous envoyer des notifications, et améliorer nos services.</Text>

          <Text style={styles.sectionTitle}>3. Partage des données</Text>
          <Text style={styles.paragraph}>Nous partageons vos informations uniquement avec les professionnels chez qui vous réservez et nos partenaires techniques (hébergement, paiement).</Text>

          <Text style={styles.sectionTitle}>4. Sécurité</Text>
          <Text style={styles.paragraph}>Nous mettons en œuvre des mesures de sécurité pour protéger vos données : chiffrement SSL, stockage sécurisé, accès restreint.</Text>

          <Text style={styles.sectionTitle}>5. Vos droits</Text>
          <Text style={styles.paragraph}>Conformément au RGPD, vous pouvez accéder, modifier ou supprimer vos données à tout moment depuis les paramètres de votre compte ou en nous contactant.</Text>
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
