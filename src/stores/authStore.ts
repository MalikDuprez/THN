import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type UserRole = "client" | "coiffeur" | "salon" | null;

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
}

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Mode démo
  demoMode: boolean;
  demoRole: UserRole;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<{ error: string | null }>;
  fetchProfile: () => Promise<void>;
  // Fonctions démo
  enableDemoMode: () => void;
  setDemoRole: (role: UserRole) => void;
}

// Utilisateur démo par défaut
const DEMO_USER: Profile = {
  id: "demo-user-001",
  email: "demo@tapehair.com",
  full_name: "Marie Dupont",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  phone: "06 12 34 56 78",
  role: "client",
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  demoMode: false,
  demoRole: "client",

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Active le mode démo avec un utilisateur fictif
  enableDemoMode: () => {
    set({
      demoMode: true,
      user: { ...DEMO_USER },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Change le rôle en mode démo (client/pro)
  setDemoRole: (role) => {
    const { user, demoMode } = get();
    if (demoMode && user) {
      set({
        demoRole: role,
        user: { ...user, role },
      });
    }
  },

  signUp: async (email, password, fullName) => {
    // En mode démo, simule l'inscription
    const { demoMode } = get();
    if (demoMode) {
      set({
        user: { ...DEMO_USER, email, full_name: fullName },
        isAuthenticated: true,
        isLoading: false,
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: null,
        });
        if (profileError) return { error: profileError.message };
        set({
          user: { id: data.user.id, email, full_name: fullName, avatar_url: null, phone: null, role: null },
          isAuthenticated: true,
          isLoading: false,
        });
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  signIn: async (email, password) => {
    // En mode démo, simule la connexion
    const { demoMode } = get();
    if (demoMode) {
      set({
        user: { ...DEMO_USER, email },
        isAuthenticated: true,
        isLoading: false,
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) await get().fetchProfile();
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  signOut: async () => {
    const { demoMode } = get();
    if (!demoMode) {
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false, demoMode: false, demoRole: "client" });
  },

  setRole: async (role) => {
    const { user, demoMode } = get();
    if (!user) return { error: "Non connecte" };

    // En mode démo, mise à jour locale uniquement
    if (demoMode) {
      set({ 
        user: { ...user, role },
        demoRole: role,
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
      if (error) return { error: error.message };

      // Si coiffeur, creer l'entree dans la table coiffeurs
      if (role === "coiffeur") {
        // Verifier si existe deja
        const { data: existing } = await supabase
          .from("coiffeurs")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (!existing) {
          const { error: coiffeurError } = await supabase.from("coiffeurs").insert({
            profile_id: user.id,
            specialty: null,
            bio: null,
            hourly_rate: null,
          });
          if (coiffeurError) console.error("Erreur creation coiffeur:", coiffeurError);
        }
      }

      // Si salon, creer l'entree dans la table salons
      if (role === "salon") {
        const { data: existing } = await supabase
          .from("salons")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (!existing) {
          await supabase.from("salons").insert({
            profile_id: user.id,
            name: user.full_name || "Mon Salon",
          });
        }
      }

      set({ user: { ...user, role } });
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  fetchProfile: async () => {
    const { demoMode } = get();
    if (demoMode) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { set({ user: null, isAuthenticated: false, isLoading: false }); return; }
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (error || !profile) { set({ user: null, isAuthenticated: false, isLoading: false }); return; }
      set({
        user: { id: profile.id, email: profile.email, full_name: profile.full_name, avatar_url: profile.avatar_url, phone: profile.phone, role: profile.role },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));