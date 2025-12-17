// app/(app)/(shared)/inspiration/[id].tsx
import { View, Text, ScrollView, Image, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { INSPIRATIONS, COIFFEURS } from "@/constants/mockData";
import { ROUTES } from "@/constants/routes";

const { width } = Dimensions.get("window");

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const inspiration = INSPIRATIONS.find((i) => i.id === id) || INSPIRATIONS[0];
  const availableCoiffeurs = COIFFEURS.slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1219" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? "#EF4444" : "white"} />
          </Pressable>
          <Pressable onPress={() => setSaved(!saved)}>
            <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={24} color={saved ? "#3B82F6" : "white"} />
          </Pressable>
          <Pressable>
            <Ionicons name="share-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView>
        {/* Image */}
        <Image source={{ uri: inspiration.image }} style={{ width: width, height: width * 1.2 }} resizeMode="cover" />

        {/* Info */}
        <View style={{ padding: 20 }}>
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>{inspiration.title}</Text>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 }}>
              <Ionicons name="female" size={14} color="#EC4899" />
              <Text style={{ color: "#9CA3AF", marginLeft: 6, fontSize: 12 }}>{inspiration.category}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 }}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={{ color: "#9CA3AF", marginLeft: 6, fontSize: 12 }}>{inspiration.duration}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16, padding: 16, backgroundColor: "#1F2937", borderRadius: 12 }}>
            <Text style={{ color: "#6B7280", fontSize: 12 }}>À partir de</Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>{inspiration.price} €</Text>
          </View>

          {/* Description */}
          <Text style={{ color: "#9CA3AF", marginTop: 20, lineHeight: 22 }}>
            Un {inspiration.title.toLowerCase()} parfait pour sublimer votre look. Cette technique moderne apporte luminosité et dimension à vos cheveux. Idéal pour un changement subtil ou une transformation complète.
          </Text>
        </View>

        {/* Coiffeurs disponibles */}
        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#1F2937" }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>Coiffeurs disponibles pour ce style</Text>
          
          {availableCoiffeurs.map((coiffeur) => (
            <Pressable
              key={coiffeur.id}
              onPress={() => router.push(ROUTES.SHARED.COIFFEUR(coiffeur.id))}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1F2937", borderRadius: 12, padding: 12, marginBottom: 12 }}
            >
              <Image source={{ uri: coiffeur.avatar }} style={{ width: 50, height: 50, borderRadius: 25 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: "white", fontWeight: "600" }}>{coiffeur.name}</Text>
                <Text style={{ color: "#6B7280", fontSize: 12 }}>{coiffeur.salon}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Ionicons name="star" size={12} color="#FBBF24" />
                  <Text style={{ color: "white", fontSize: 12, marginLeft: 4 }}>{coiffeur.rating}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 8 }}>Dès {coiffeur.price}€</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#1F2937" }}>
        <Pressable
          onPress={() => router.push(ROUTES.CLIENT.BOOKING.SERVICE)}
          style={{ backgroundColor: "#3B82F6", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Réserver cette coupe</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}