// components/CoiffeurCard.tsx
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const theme = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  text: "#000000",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#EBEBEB",
  success: "#2E7D32",
  successLight: "#E8F5E9",
};

interface CoiffeurCardProps {
  item: {
    id: string;
    name: string;
    salon: string;
    specialty: string;
    distance: string;
    rating: number;
    reviews: number;
    price: number;
    avatar: string;
    atHome: boolean;
  };
  onPress: () => void;
}

export default function CoiffeurCard({ item, onPress }: CoiffeurCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.atHome && (
              <View style={styles.atHomeBadge}>
                <Ionicons name="home" size={12} color={theme.success} />
                <Text style={styles.atHomeText}>À domicile</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </View>
        
        <Text style={styles.salon}>{item.salon}</Text>
        <Text style={styles.specialty}>{item.specialty}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
            <Text style={styles.metaText}>{item.distance}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewsText}>({item.reviews})</Text>
          </View>
          
          <Text style={styles.price}>Dès {item.price}€</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.text,
  },
  atHomeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  atHomeText: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.success,
  },
  salon: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  specialty: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
  reviewsText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
  },
});