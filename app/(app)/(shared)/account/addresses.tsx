// app/(app)/(shared)/account/addresses.tsx
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getMyAddresses,
  deleteAddress,
  setDefaultAddress,
  type Address,
} from "@/api/addresses";

// ============================================
// THEME
// ============================================
const theme = {
  black: "#000000",
  white: "#FFFFFF",
  card: "#F8FAFC",
  text: "#000000",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#3B82F6",
  accentLight: "#EFF6FF",
  success: "#10B981",
  successLight: "#ECFDF5",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  border: "#E2E8F0",
};

// ============================================
// COMPOSANTS
// ============================================

const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) => (
  <View style={styles.addressCard}>
    <View style={styles.addressHeader}>
      <View style={styles.addressLabelRow}>
        <Ionicons
          name={address.label === "Travail" ? "briefcase-outline" : "home-outline"}
          size={20}
          color={theme.accent}
        />
        <Text style={styles.addressLabel}>
          {address.label || "Adresse"}
        </Text>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Par défaut</Text>
          </View>
        )}
      </View>
      <Pressable onPress={onEdit} hitSlop={10}>
        <Ionicons name="create-outline" size={20} color={theme.textMuted} />
      </Pressable>
    </View>

    <Text style={styles.addressLine}>{address.address_line}</Text>
    {address.address_line_2 && (
      <Text style={styles.addressLine2}>{address.address_line_2}</Text>
    )}
    <Text style={styles.addressCity}>
      {address.postal_code} {address.city}
    </Text>

    {address.instructions && (
      <View style={styles.instructionsContainer}>
        <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
        <Text style={styles.instructions}>{address.instructions}</Text>
      </View>
    )}

    <View style={styles.addressActions}>
      {!address.is_default && (
        <Pressable style={styles.setDefaultButton} onPress={onSetDefault}>
          <Ionicons name="star-outline" size={16} color={theme.accent} />
          <Text style={styles.setDefaultButtonText}>Définir par défaut</Text>
        </Pressable>
      )}
      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color={theme.error} />
      </Pressable>
    </View>
  </View>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Ionicons name="location-outline" size={48} color={theme.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>Aucune adresse</Text>
    <Text style={styles.emptyText}>
      Ajoutez une adresse pour faciliter vos réservations
    </Text>
    <Pressable style={styles.emptyButton} onPress={onAdd}>
      <Ionicons name="add" size={20} color={theme.white} />
      <Text style={styles.emptyButtonText}>Ajouter une adresse</Text>
    </Pressable>
  </View>
);

// ============================================
// ÉCRAN PRINCIPAL
// ============================================
export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAddresses = async () => {
    try {
      const data = await getMyAddresses();
      setAddresses(data);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Rafraîchir quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  const handleAdd = () => {
    router.push("/(app)/(shared)/account/address-form" as any);
  };

  const handleEdit = (address: Address) => {
    router.push({
      pathname: "/(app)/(shared)/account/address-form" as any,
      params: { id: address.id },
    });
  };

  const handleDelete = (address: Address) => {
    Alert.alert(
      "Supprimer l'adresse",
      `Voulez-vous vraiment supprimer "${address.label || "cette adresse"}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteAddress(address.id);
            if (success) {
              setAddresses((prev) => prev.filter((a) => a.id !== address.id));
            } else {
              Alert.alert("Erreur", "Impossible de supprimer l'adresse");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (address: Address) => {
    const success = await setDefaultAddress(address.id);
    if (success) {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === address.id,
        }))
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes adresses</Text>
        <Pressable onPress={handleAdd} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.accent} />
        </Pressable>
      </View>

      {addresses.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={theme.accent} />
            <Text style={styles.infoText}>
              L'adresse par défaut sera utilisée pour vos réservations à domicile.
            </Text>
          </View>

          {/* Liste des adresses */}
          <View style={styles.addressesList}>
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => handleEdit(address)}
                onDelete={() => handleDelete(address)}
                onSetDefault={() => handleSetDefault(address)}
              />
            ))}
          </View>

          {/* Bouton ajouter */}
          <Pressable style={styles.addAddressButton} onPress={handleAdd}>
            <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
            <Text style={styles.addAddressButtonText}>Ajouter une adresse</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.white,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.accentLight,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  // Addresses List
  addressesList: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },

  // Address Card
  addressCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: theme.successLight,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.success,
  },
  addressLine: {
    fontSize: 15,
    color: theme.text,
    marginBottom: 2,
  },
  addressLine2: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  addressCity: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  instructionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  instructions: {
    flex: 1,
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: "italic",
  },
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  setDefaultButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  setDefaultButtonText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
  },

  // Add Button
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: "dashed",
    borderRadius: 14,
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.accent,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: theme.black,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.white,
  },
});