// components/FilterChips.tsx
import { ScrollView, Pressable, Text } from "react-native";

interface FilterChipsProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  colorActive?: string;
}

export default function FilterChips({ filters, activeFilter, onFilterChange, colorActive = "#3B82F6" }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {filters.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onFilterChange(filter)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: activeFilter === filter ? colorActive : "#374151",
            borderWidth: activeFilter === filter ? 0 : 1,
            borderColor: "#4B5563",
          }}
        >
          <Text style={{ color: "white", fontSize: 13, fontWeight: activeFilter === filter ? "600" : "400" }}>{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}