// constants/theme.ts

export const COLORS = {
  // Barber Shop palette - subtil et élégant
  barber: {
    blue: "#1E3A5F",      // Bleu profond
    blueLight: "#3B82F6", // Bleu clair
    white: "#F8FAFC",     // Blanc cassé
    red: "#8B2942",       // Rouge bordeaux
    redLight: "#DC2626",  // Rouge vif (accent)
  },
  
  // Dégradés
  gradients: {
    barberPrimary: ["#1E3A5F", "#3B5998", "#8B2942"], // Bleu → Bleu moyen → Rouge
    barberSubtle: ["rgba(30,58,95,0.8)", "rgba(59,89,152,0.6)", "rgba(139,41,66,0.8)"],
    barberGlass: ["rgba(30,58,95,0.3)", "rgba(248,250,252,0.1)", "rgba(139,41,66,0.3)"],
    glassReflect: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)", "transparent"],
  },
  
  // Theme Dark
  dark: {
    background: "#000000",
    surface: "#0A0A0A",
    card: "#111111",
    cardHover: "#1A1A1A",
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    border: "rgba(255,255,255,0.1)",
    borderLight: "rgba(255,255,255,0.05)",
  },
  
  // Theme Light
  light: {
    background: "#FFFFFF",
    surface: "#F8FAFC",
    card: "#FFFFFF",
    cardHover: "#F1F5F9",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    border: "rgba(0,0,0,0.1)",
    borderLight: "rgba(0,0,0,0.05)",
  },
};

export type ThemeMode = "dark" | "light";

export const getTheme = (mode: ThemeMode) => {
  return mode === "dark" ? COLORS.dark : COLORS.light;
};