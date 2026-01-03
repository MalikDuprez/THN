// app/(app)/(shared)/account/personal-info.tsx
import { View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@stores/authStore";
import { getUserAvatar } from "@/constants/images";

const theme = {
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E5E5E5",
  card: "#F5F5F5",
};

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [name, setName] = useState(user?.full_name || "Jean Dupont");
  const [email, setEmail] = useState(user?.email || "jean@example.com");
  const [phone, setPhone] = useState(user?.phone || "06 12 34 56 78");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Informations personnelles</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <Image source={{ uri: getUserAvatar(user?.avatar_url, user?.full_name) }} style={styles.avatar} />
          <Pressable style={styles.changeAvatarButton}>
            <Text style={styles.changeAvatarText}>Changer la photo</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Pressable style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </Pressable>
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
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  changeAvatarButton: { paddingVertical: 8, paddingHorizontal: 16 },
  changeAvatarText: { fontSize: 14, color: theme.text, fontWeight: "600" },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.text },
  saveButton: { backgroundColor: theme.text, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 32 },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});