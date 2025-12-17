// components/ServiceCard.tsx
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ServiceCardProps {
  item: {
    id: string;
    category: string;
    name: string;
    salon: string;
    duration: string;
    rating: number;
    price: number;
  };
  onPress: () => void;
}

export default function ServiceCard({ item, onPress }: ServiceCardProps) {
  return (
    <View style={{ backgroundColor: "#1F2937", borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#6B7280", fontSize: 12 }}>{item.category}</Text>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>{item.name}</Text>
          <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 4 }}>{item.salon}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>{item.duration}</Text>
            <Text style={{ color: "#6B7280", marginHorizontal: 8 }}>•</Text>
            <Ionicons name="sparkles" size={12} color="#8B5CF6" />
            <Text style={{ color: "#8B5CF6", fontSize: 12, marginLeft: 4 }}>{item.rating}</Text>
          </View>
        </View>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>{item.price}€</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{ backgroundColor: "#3B82F6", borderRadius: 12, paddingVertical: 14, marginTop: 16, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>Réserver maintenant</Text>
      </Pressable>
    </View>
  );
}