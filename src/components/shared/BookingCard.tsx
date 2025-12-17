// components/BookingCard.tsx
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BookingCardProps {
  item: {
    id: string;
    service: string;
    coiffeur: string;
    avatar: string | null;
    price: number;
    date: string;
    time: string;
    location: string;
    status: string;
  };
}

export default function BookingCard({ item }: BookingCardProps) {
  const isUpcoming = item.status === "upcoming";

  return (
    <View style={{ backgroundColor: "#1F2937", borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
          ) : (
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#374151", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="storefront" size={24} color="#6B7280" />
            </View>
          )}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>{item.service}</Text>
            <Text style={{ color: "#9CA3AF", fontSize: 13, marginTop: 2 }}>{item.coiffeur}</Text>
            {isUpcoming && (
              <View style={{ backgroundColor: "#3B82F620", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start", marginTop: 6 }}>
                <Text style={{ color: "#3B82F6", fontSize: 11, fontWeight: "600" }}>À venir</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{item.price}€</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={{ color: "#9CA3AF", marginLeft: 8 }}>{item.date}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={{ color: "#9CA3AF", marginLeft: 8 }}>{item.time}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={{ color: "#9CA3AF", marginLeft: 8 }}>{item.location}</Text>
        </View>
      </View>

      {isUpcoming && (
        <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
          <Pressable style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#374151" }}>
            <Ionicons name="create-outline" size={16} color="white" />
            <Text style={{ color: "white", marginLeft: 6, fontWeight: "500" }}>Modifier</Text>
          </Pressable>
          <Pressable style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, backgroundColor: "#374151" }}>
            <Ionicons name="chatbubble-outline" size={16} color="white" />
            <Text style={{ color: "white", marginLeft: 6, fontWeight: "500" }}>Contact</Text>
          </Pressable>
          <Pressable style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#EF4444" }}>
            <Ionicons name="close" size={16} color="#EF4444" />
            <Text style={{ color: "#EF4444", marginLeft: 6, fontWeight: "500" }}>Annuler</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}