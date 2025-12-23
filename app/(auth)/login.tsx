// app/(auth)/login.tsx
import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fetchProfile } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Erreur", "Email ou mot de passe incorrect");
        } else {
          Alert.alert("Erreur", error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Attendre un peu que le trigger crée le profil (si nouvelle inscription)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Vérifier si l'onboarding est complété
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.user.id)
          .maybeSingle();

        // Charger le profil dans le store
        await fetchProfile();

        // Rediriger selon l'état de l'onboarding
        if (profile?.onboarding_completed) {
          router.replace(ROUTES.CLIENT.HOME);
        } else {
          router.replace("/(auth)/onboarding/personal-info");
        }
      }
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#999" 
                />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable 
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            )}
          </Pressable>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <Pressable onPress={() => router.replace(ROUTES.AUTH.REGISTER)}>
              <Text style={styles.registerLink}>S'inscrire</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    marginLeft: -12,
    marginBottom: 20,
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
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
  },
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  actions: {
    paddingTop: 32,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  registerText: {
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});