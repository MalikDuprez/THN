// components/LiquidGlassTabs.tsx
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Tab {
  key: string;
  label: string;
  icon?: string;
}

interface LiquidGlassTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function LiquidGlassTabs({ tabs, activeTab, onTabChange }: LiquidGlassTabsProps) {
  return (
    <View style={styles.container}>
      {/* Fond ultra transparent */}
      <BlurView 
        intensity={Platform.OS === "ios" ? 15 : 30} 
        tint="dark" 
        style={styles.blur}
      />
      <View style={styles.tint} />
      <View style={styles.border} />
      
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={styles.tabButton}
            >
              {isActive && (
                <View style={styles.activeIndicator}>
                  <LinearGradient
                    colors={["rgba(99,102,241,0.85)", "rgba(139,92,246,0.85)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeGradient}
                  />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.15)", "transparent"]}
                    style={styles.activeReflect}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <View style={styles.activeBorder} />
                </View>
              )}
              
              <View style={styles.tabContent}>
                {tab.icon && (
                  <Ionicons 
                    name={tab.icon as any} 
                    size={15} 
                    color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)"} 
                  />
                )}
                <Text style={[
                  styles.tabLabel,
                  { 
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                    fontWeight: isActive ? "600" : "400",
                    marginLeft: tab.icon ? 6 : 0,
                  }
                ]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    height: 44,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    padding: 3,
  },
  tabButton: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    overflow: "hidden",
  },
  activeIndicator: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    overflow: "hidden",
  },
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activeReflect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});