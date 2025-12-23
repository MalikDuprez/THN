// app/(auth)/register.tsx
import { useState, useMemo } from "react";
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
import { ROUTES } from "@/constants/routes";

// ============================================
// PASSWORD STRENGTH CALCULATOR
// ============================================
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (passedChecks === 0) {
    return { score: 0, label: "", color: "#E0E0E0", checks };
  } else if (passedChecks <= 2) {
    return { score: 1, label: "Faible", color: "#E53935", checks };
  } else if (passedChecks === 3) {
    return { score: 2, label: "Moyen", color: "#FB8C00", checks };
  } else if (passedChecks === 4) {
    return { score: 3, label: "Fort", color: "#7CB342", checks };
  } else {
    return { score: 4, label: "Très fort", color: "#43A047", checks };
  }
};

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculer la force du mot de passe
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  // Validation
  const isPasswordValid = passwordStrength.checks.length && passwordStrength.checks.special;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleRegister = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!passwordStrength.checks.length) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!passwordStrength.checks.special) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins un caractère spécial (!@#$%...)");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // Créer le compte (le trigger crée automatiquement le profil)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("already registered")) {
          Alert.alert("Erreur", "Un compte existe déjà avec cet email");
        } else {
          Alert.alert("Erreur", error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Rediriger vers l'onboarding
        router.replace("/(auth)/onboarding/personal-info");
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
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté TapeHair</Text>
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
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#999" 
                />
              </Pressable>
            </View>

            {/* Barre de force du mot de passe */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength.score >= level
                              ? passwordStrength.color
                              : "#E0E0E0",
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Critères du mot de passe */}
            {password.length > 0 && (
              <View style={styles.criteriaContainer}>
                <View style={styles.criteriaRow}>
                  <Ionicons
                    name={passwordStrength.checks.length ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={passwordStrength.checks.length ? "#43A047" : "#999"}
                  />
                  <Text style={[
                    styles.criteriaText,
                    passwordStrength.checks.length && styles.criteriaTextValid
                  ]}>
                    8 caractères minimum
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Ionicons
                    name={passwordStrength.checks.special ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={passwordStrength.checks.special ? "#43A047" : "#999"}
                  />
                  <Text style={[
                    styles.criteriaText,
                    passwordStrength.checks.special && styles.criteriaTextValid
                  ]}>
                    Un caractère spécial (!@#$%...)
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Ionicons
                    name={passwordStrength.checks.uppercase ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={passwordStrength.checks.uppercase ? "#43A047" : "#999"}
                  />
                  <Text style={[
                    styles.criteriaText,
                    passwordStrength.checks.uppercase && styles.criteriaTextValid
                  ]}>
                    Une majuscule
                  </Text>
                </View>
                <View style={styles.criteriaRow}>
                  <Ionicons
                    name={passwordStrength.checks.number ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={passwordStrength.checks.number ? "#43A047" : "#999"}
                  />
                  <Text style={[
                    styles.criteriaText,
                    passwordStrength.checks.number && styles.criteriaTextValid
                  ]}>
                    Un chiffre
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={[
              styles.inputContainer,
              confirmPassword.length > 0 && (doPasswordsMatch ? styles.inputValid : styles.inputError)
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
              {confirmPassword.length > 0 && (
                <Ionicons
                  name={doPasswordsMatch ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={doPasswordsMatch ? "#43A047" : "#E53935"}
                />
              )}
            </View>
            {confirmPassword.length > 0 && !doPasswordsMatch && (
              <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable 
            style={[
              styles.primaryButton, 
              (!isPasswordValid || !doPasswordsMatch || loading) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={!isPasswordValid || !doPasswordsMatch || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>S'inscrire</Text>
            )}
          </Pressable>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ?</Text>
            <Pressable onPress={() => router.replace(ROUTES.AUTH.LOGIN)}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </Pressable>
          </View>

          <Text style={styles.terms}>
            En vous inscrivant, vous acceptez nos{" "}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text>
            {" "}et notre{" "}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>
          </Text>
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputValid: {
    borderColor: "#43A047",
    backgroundColor: "#F1F8E9",
  },
  inputError: {
    borderColor: "#E53935",
    backgroundColor: "#FFEBEE",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
  },
  errorText: {
    fontSize: 12,
    color: "#E53935",
    marginTop: 4,
  },

  // Password strength
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 60,
  },

  // Criteria
  criteriaContainer: {
    gap: 6,
    marginTop: 8,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  criteriaText: {
    fontSize: 12,
    color: "#999",
  },
  criteriaTextValid: {
    color: "#43A047",
  },

  // Actions
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
    opacity: 0.4,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  terms: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#666",
    textDecorationLine: "underline",
  },
});