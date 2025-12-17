// app/(auth)/role-selection.tsx
import { useState } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

type Role = "client" | "coiffeur" | "salon";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLES: RoleOption[] = [
  {
    id: "client",
    title: "Client",
    description: "Je cherche un coiffeur pour mes soins capillaires",
    icon: "person-outline",
  },
  {
    id: "coiffeur",
    title: "Coiffeur indépendant",
    description: "Je propose mes services en tant que coiffeur freelance",
    icon: "cut-outline",
  },
  {
    id: "salon",
    title: "Salon de coiffure",
    description: "Je gère un salon et je veux recruter des clients",
    icon: "business-outline",
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRole, demoMode, setDemoRole } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Erreur", "Veuillez sélectionner un profil");
      return;
    }

    setLoading(true);
    
    // En mode démo, mise à jour locale et redirection immédiate
    if (demoMode) {
      setDemoRole(selectedRole);
      setLoading(false);
      
      // Redirection selon le rôle
      if (selectedRole === "client") {
        router.replace(ROUTES.CLIENT.HOME);
      } else {
        // coiffeur ou salon → mode pro
        router.replace(ROUTES.PRO.DASHBOARD);
      }
      return;
    }

    // Mode normal avec Supabase
    const { error } = await setRole(selectedRole);
    setLoading(false);

    if (error) {
      Alert.alert("Erreur", error);
      return;
    }

    // Redirection selon le rôle
    if (selectedRole === "client") {
      router.replace(ROUTES.CLIENT.HOME);
    } else {
      router.replace(ROUTES.PRO.DASHBOARD);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Qui êtes-vous ?</Text>
        <Text style={styles.subtitle}>
          Choisissez votre profil pour personnaliser votre expérience
        </Text>
      </View>

      {/* Roles */}
      <View style={styles.roles}>
        {ROLES.map((role) => (
          <Pressable
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <View style={[
              styles.roleIcon,
              selectedRole === role.id && styles.roleIconSelected,
            ]}>
              <Ionicons 
                name={role.icon} 
                size={28} 
                color={selectedRole === role.id ? "#FFF" : "#000"} 
              />
            </View>
            <View style={styles.roleContent}>
              <Text style={[
                styles.roleTitle,
                selectedRole === role.id && styles.roleTitleSelected,
              ]}>
                {role.title}
              </Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            <View style={[
              styles.roleCheck,
              selectedRole === role.id && styles.roleCheckSelected,
            ]}>
              {selectedRole === role.id && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          style={[
            styles.primaryButton, 
            !selectedRole && styles.buttonDisabled,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Continuer</Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Vous pourrez modifier ce choix plus tard dans vos paramètres
        </Text>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  roles: {
    flex: 1,
    gap: 12,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 14,
  },
  roleCardSelected: {
    backgroundColor: "#F0F0F0",
    borderColor: "#000",
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  roleIconSelected: {
    backgroundColor: "#000",
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: "#000",
  },
  roleDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  roleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
  },
  roleCheckSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
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
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
