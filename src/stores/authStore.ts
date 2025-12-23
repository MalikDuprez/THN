import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type UserRole = "client" | "coiffeur" | "salon" | null;
type Gender = "male" | "female" | "other" | null;

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  gender: Gender;
  gender_custom: string | null;
  birth_date: string | null;
  created_at: string | null;
  onboarding_completed: boolean;
  rating_as_client: number | null;
  reviews_count_as_client: number | null;
}

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoMode: boolean;
  demoRole: UserRole;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<{ error: string | null }>;
  fetchProfile: () => Promise<void>;
  enableDemoMode: () => void;
  setDemoRole: (role: UserRole) => void;
}

const DEMO_USER: Profile = {
  id: "demo-user-001",
  email: "demo@tapehair.com",
  first_name: "Marie",
  last_name: "Dupont",
  full_name: "Marie Dupont",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  phone: "0612345678",
  role: "client",
  gender: "female",
  gender_custom: null,
  birth_date: "1990-05-15",
  created_at: "2023-01-15T10:00:00Z",
  onboarding_completed: true,
  rating_as_client: 4.9,
  reviews_count_as_client: 12,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  demoMode: false,
  demoRole: "client",

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),

  enableDemoMode: () => {
    set({
      demoMode: true,
      user: { ...DEMO_USER },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setDemoRole: (role) => {
    const { user, demoMode } = get();
    if (demoMode && user) {
      set({
        demoRole: role,
        user: { ...user, role },
      });
    }
  },

  signUp: async (email, password) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error: error.message };

      // Le profil sera chargé après l'onboarding
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  signIn: async (email, password) => {
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
    if (!user) return { error: "Non connecté" };

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

      if (role === "coiffeur") {
        const { data: existing } = await supabase
          .from("coiffeurs")
          .select("id")
          .eq("profile_id", user.id)
          .single();

        if (!existing) {
          const { error: coiffeurError } = await supabase.from("coiffeurs").insert({
            profile_id: user.id,
            display_name: user.full_name,
            gender: user.gender,
          });
          if (coiffeurError) console.error("Erreur création coiffeur:", coiffeurError);
        }
      }

      if (role === "salon") {
        const { data: existing } = await supabase
          .from("salons")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!existing) {
          const { error: salonError } = await supabase.from("salons").insert({
            owner_id: user.id,
            name: user.full_name || "Mon Salon",
          });
          if (salonError) console.error("Erreur création salon:", salonError);
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
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      if (!profile) {
        // Profil n'existe pas encore, l'utilisateur doit faire l'onboarding
        set({ 
          user: {
            id: authUser.id,
            email: authUser.email || "",
            first_name: null,
            last_name: null,
            full_name: null,
            avatar_url: null,
            phone: null,
            role: "client",
            gender: null,
            gender_custom: null,
            birth_date: null,
            created_at: null,
            onboarding_completed: false,
            rating_as_client: null,
            reviews_count_as_client: null,
          }, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return;
      }

      set({
        user: {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          role: profile.role,
          gender: profile.gender,
          gender_custom: profile.gender_custom,
          birth_date: profile.birth_date,
          created_at: profile.created_at,
          onboarding_completed: profile.onboarding_completed || false,
          rating_as_client: profile.rating_as_client,
          reviews_count_as_client: profile.reviews_count_as_client,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      console.error("fetchProfile error:", e);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));