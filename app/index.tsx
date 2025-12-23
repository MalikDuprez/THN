// app/index.tsx
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Pas connecté → Welcome
          setRedirectTo(ROUTES.AUTH.WELCOME);
          setIsLoading(false);
          return;
        }

        // 2. Récupérer le profil pour vérifier l'onboarding
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle();

        // 3. Si le profil n'existe pas, déconnecter (session invalide)
        if (!profile) {
          console.log("Profile not found - signing out");
          await supabase.auth.signOut();
          setRedirectTo(ROUTES.AUTH.WELCOME);
          setIsLoading(false);
          return;
        }

        // 4. Charger le profil dans le store
        await fetchProfile();

        // 5. Rediriger selon l'état de l'onboarding
        if (profile?.onboarding_completed) {
          setRedirectTo(ROUTES.CLIENT.HOME);
        } else {
          // Onboarding non terminé → reprendre l'onboarding
          setRedirectTo("/(auth)/onboarding/personal-info");
        }
      } catch (error) {
        console.error("Init auth error:", error);
        setRedirectTo(ROUTES.AUTH.WELCOME);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setRedirectTo(ROUTES.AUTH.WELCOME);
        } else if (event === "SIGNED_IN" && session) {
          // Vérifier l'onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", session.user.id)
            .maybeSingle();

          // Si pas de profil, le trigger aurait dû le créer - attendre un peu
          if (!profile) {
            // Attendre que le trigger crée le profil
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: retryProfile } = await supabase
              .from("profiles")
              .select("onboarding_completed")
              .eq("id", session.user.id)
              .maybeSingle();
            
            if (!retryProfile) {
              console.error("Profile still not found after retry");
              setRedirectTo("/(auth)/onboarding/personal-info");
              return;
            }
            
            await fetchProfile();
            setRedirectTo(retryProfile.onboarding_completed 
              ? ROUTES.CLIENT.HOME 
              : "/(auth)/onboarding/personal-info"
            );
          } else {
            await fetchProfile();
            setRedirectTo(profile.onboarding_completed 
              ? ROUTES.CLIENT.HOME 
              : "/(auth)/onboarding/personal-info"
            );
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Afficher un loader pendant la vérification
  if (isLoading || !redirectTo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return <Redirect href={redirectTo as any} />;
}