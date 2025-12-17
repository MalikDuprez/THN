// components/ProductCard.tsx
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProductCardProps {
  item: {
    id: string;
    brand: string;
    name: string;
    category: string;
    price: number;
    inStock: boolean;
  };
  onPress: () => void;
}

export default function ProductCard({ item, onPress }: ProductCardProps) {
  return (
    <Pressable onPress={onPress} style={{ width: "48%", backgroundColor: "#1F2937", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
      {item.inStock && (
        <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 1 }}>
          <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>En stock</Text>
        </View>
      )}
      <View style={{ height: 120, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="cube-outline" size={40} color="#6B7280" />
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ color: "#6B7280", fontSize: 11 }}>{item.brand}</Text>
        <Text style={{ color: "white", fontSize: 14, fontWeight: "600", marginTop: 4 }} numberOfLines={2}>{item.name}</Text>
        <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}>{item.category}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>{item.price}€</Text>
          <Pressable style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}