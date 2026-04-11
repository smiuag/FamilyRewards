"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";
import { fetchFamilySettings } from "@/lib/api/members";
import { fetchFamilyTasks } from "@/lib/api/tasks";
import { fetchFamilyRewards } from "@/lib/api/rewards";
import { acceptInvitationAction } from "@/lib/actions/accept-invitation";
import { Star, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface SupabaseProfile {
  id: string;
  auth_user_id: string | null;
  family_id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  points_balance: number;
  created_at: string;
}

function toUser(p: SupabaseProfile): User {
  return {
    id: p.id,
    familyId: p.family_id,
    name: p.name,
    avatar: p.avatar,
    role: p.role,
    pointsBalance: p.points_balance,
    createdAt: p.created_at,
    authUserId: p.auth_user_id,
  };
}

export default function ProfileSelectClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "es";
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/${locale}/login`);
        return;
      }

      // Procesar invitación pendiente ANTES de cargar perfiles
      // (Google OAuth desde /join: el trigger creó familia equivocada, hay que arreglarlo primero)
      const pendingRaw = localStorage.getItem("pending_invitation");
      if (pendingRaw) {
        localStorage.removeItem("pending_invitation");
        try {
          const pending = JSON.parse(pendingRaw) as { token?: string; name?: string | null; avatar?: string };
          if (pending.token) {
            await acceptInvitationAction({
              token: pending.token,
              authUserId: user.id,
              name: pending.name,
              avatar: pending.avatar,
            });
          }
        } catch (err) {
          console.error("Error aceptando invitación:", err);
        }
      }

      // Cargar perfiles de la familia (RLS filtra automáticamente)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (profilesError || !profilesData?.length) {
        setError("No se pudieron cargar los perfiles. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      // Cargar nombre de la familia
      const familyId = profilesData[0].family_id;

      // Cargar configuración de la familia (nombre + estado onboarding)
      const familySettings = await fetchFamilySettings(familyId);

      // Auto-login: buscar el perfil que corresponde al auth user
      const myProfile = profilesData.find((p) => p.auth_user_id === user.id);
      if (myProfile) {
        const allUsers = profilesData.map(toUser);
        const store = useAppStore.getState();
        store.initRealAuth(allUsers, toUser(myProfile), familySettings.name);
        // Cargar estado de onboarding desde BD
        useAppStore.setState({
          onboardingCompleted: familySettings.onboardingCompleted,
          setupVisited: familySettings.setupVisited,
        });
        // Cargar tareas y recompensas para los badges del sidebar
        const [familyTasks, familyRewards] = await Promise.all([
          fetchFamilyTasks().catch(() => []),
          fetchFamilyRewards().catch(() => []),
        ]);
        useAppStore.setState({ tasks: familyTasks, rewards: familyRewards });
        useMultipliersStore.getState().reset();
        router.replace(next);
        return;
      }

      // Fallback: mostrar selector (no debería pasar normalmente)
      setProfiles(profilesData);
      setFamilyName(familySettings.name);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, next]);

  const handleSelect = async (profile: SupabaseProfile) => {
    const allUsers = profiles.map(toUser);
    const familySettings = await fetchFamilySettings(profile.family_id);
    useAppStore.getState().initRealAuth(allUsers, toUser(profile), familySettings.name);
    useAppStore.setState({
      onboardingCompleted: familySettings.onboardingCompleted,
      setupVisited: familySettings.setupVisited,
    });
    const [familyTasks, familyRewards] = await Promise.all([
      fetchFamilyTasks().catch(() => []),
      fetchFamilyRewards().catch(() => []),
    ]);
    useAppStore.setState({ tasks: familyTasks, rewards: familyRewards });
    useMultipliersStore.getState().reset();
    router.push(next);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Entrando...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Star className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{familyName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Selecciona tu perfil</p>
        </div>

        {/* Profiles */}
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-transparent shadow-sm hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                {profile.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">{profile.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs font-semibold text-primary">
                    {profile.points_balance.toLocaleString()} pts
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    · {profile.role === "admin" ? "Admin" : "Miembro"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-colors",
                "group-hover:bg-primary group-hover:text-primary-foreground"
              )}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mx-auto mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
