// app/(auth)/welcome.tsx
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { enableDemoMode } = useAuthStore();

  const handleDemoMode = () => {
    enableDemoMode();
    router.push(ROUTES.AUTH.ROLE_SELECTION);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Logo / Illustration */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="cut" size={60} color="#000" />
        </View>
        <Text style={styles.title}>Clipper Connect</Text>
        <Text style={styles.subtitle}>
          La coiffure à portée de main, 24h/24
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.feature}>
          <Ionicons name="location-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Trouvez des coiffeurs près de chez vous</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="calendar-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Réservez 24h/24, 7j/7</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="card-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Paiement sécurisé dans l'app</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={styles.primaryButton}
          onPress={() => router.push(ROUTES.AUTH.REGISTER)}
        >
          <Text style={styles.primaryButtonText}>Créer un compte</Text>
        </Pressable>

        <Pressable 
          style={styles.secondaryButton}
          onPress={() => router.push(ROUTES.AUTH.LOGIN)}
        >
          <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
        </Pressable>

        {/* Bouton Mode Démo */}
        <Pressable 
          style={styles.demoButton}
          onPress={handleDemoMode}
        >
          <Ionicons name="play-circle-outline" size={20} color="#666" />
          <Text style={styles.demoButtonText}>Essayer en mode démo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  features: {
    paddingVertical: 32,
    gap: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  actions: {
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  demoButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});
