// components/RoleToggle.tsx
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RoleToggleProps {
  activeRole: "client" | "coiffeur";
  onRoleChange: (role: "client" | "coiffeur") => void;
}

export default function RoleToggle({ activeRole, onRoleChange }: RoleToggleProps) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#1a1f2e", borderRadius: 25, padding: 4 }}>
      <Pressable
        onPress={() => onRoleChange("client")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: activeRole === "client" ? "#3B82F6" : "transparent",
        }}
      >
        <Ionicons name="people" size={16} color="white" />
        <Text style={{ color: "white", marginLeft: 6, fontWeight: "500", fontSize: 13 }}>Client</Text>
      </Pressable>
      <Pressable
        onPress={() => onRoleChange("coiffeur")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: activeRole === "coiffeur" ? "#3B82F6" : "transparent",
        }}
      >
        <Ionicons name="cut" size={16} color={activeRole === "coiffeur" ? "white" : "#9CA3AF"} />
        <Text style={{ color: activeRole === "coiffeur" ? "white" : "#9CA3AF", marginLeft: 6, fontWeight: "500", fontSize: 13 }}>Coiffeur</Text>
      </Pressable>
    </View>
  );
}