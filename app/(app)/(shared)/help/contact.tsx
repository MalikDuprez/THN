// app/(app)/(shared)/help/contact.tsx
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
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

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Nous contacter</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Sujet</Text>
          <TextInput style={styles.input} placeholder="Ex: Problème de paiement" placeholderTextColor={theme.textMuted} value={subject} onChangeText={setSubject} />

          <Text style={styles.label}>Message</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Décrivez votre problème..." placeholderTextColor={theme.textMuted} value={message} onChangeText={setMessage} multiline numberOfLines={6} textAlignVertical="top" />

          <Pressable style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Envoyer</Text>
          </Pressable>

          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Autres moyens de contact</Text>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color={theme.text} />
              <Text style={styles.contactText}>support@tapehair.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color={theme.text} />
              <Text style={styles.contactText}>01 23 45 67 89</Text>
            </View>
          </View>
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
  label: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.text },
  textArea: { height: 150, paddingTop: 14 },
  submitButton: { backgroundColor: theme.text, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  submitButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  contactInfo: { marginTop: 32, padding: 20, backgroundColor: theme.card, borderRadius: 16 },
  contactTitle: { fontSize: 15, fontWeight: "600", color: theme.text, marginBottom: 16 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  contactText: { fontSize: 14, color: theme.textSecondary },
});
