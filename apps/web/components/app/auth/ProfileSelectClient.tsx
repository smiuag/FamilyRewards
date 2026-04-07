"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
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
  };
}

export default function ProfileSelectClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "es";
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  const { setCurrentProfile } = useAppStore();

  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/${locale}/login`);
        return;
      }

      // Cargar perfiles de la familia (RLS filtra automáticamente)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (profilesError || !profilesData?.length) {
        setError("No se pudieron cargar los perfiles. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      // Cargar nombre de la familia
      const familyId = profilesData[0].family_id;
      const { data: familyData } = await supabase
        .from("families")
        .select("name")
        .eq("id", familyId)
        .single();

      setProfiles(profilesData);
      setFamilyName(familyData?.name ?? "Mi familia");
      setLoading(false);
    }

    load();
  }, [locale, router]);

  const handleSelect = (profile: SupabaseProfile) => {
    setCurrentProfile(toUser(profile));
    router.push(next);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando familia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{familyName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">¿Quién eres tú hoy?</p>
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
                "group-hover:bg-primary group-hover:text-white"
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
    </div>
  );
}
