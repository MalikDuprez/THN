// components/SalonCard.tsx
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SalonCardProps {
  item: {
    id: string;
    name: string;
    rating: number;
    services: number;
    distance: string;
    image: string;
  };
  onPress: () => void;
}

export default function SalonCard({ item, onPress }: SalonCardProps) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: "#1F2937", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
      <Image source={{ uri: item.image }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
      <View style={{ padding: 16 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Ionicons name="sparkles" size={14} color="#8B5CF6" />
          <Text style={{ color: "white", fontSize: 13, marginLeft: 6 }}>{item.rating}</Text>
          <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 16 }}>{item.services} services</Text>
          <Text style={{ color: "#6B7280", fontSize: 13, marginLeft: 16 }}>{item.distance}</Text>
        </View>
      </View>
    </Pressable>
  );
}