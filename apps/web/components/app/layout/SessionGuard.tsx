"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";
import { fetchFamilySettings, fetchFamilyProfiles, fetchFamilyFeatureFlags } from "@/lib/api/members";
import { fetchFamilyTasks } from "@/lib/api/tasks";
import { fetchFamilyRewards } from "@/lib/api/rewards";

/**
 * Verifies the Supabase session on mount.
 * If the session is valid but the store is empty (e.g. hard refresh),
 * it re-fetches all data from the server and restores the store.
 * If no session exists, redirects to login.
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser } = useAppStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // If store already has a user, just validate the session is still alive
      if (currentUser) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Session expired — clear store and redirect
          useAppStore.getState().logout();
          router.replace(`/${locale}/login`);
          return;
        }
        // tasks/rewards are not persisted in localStorage — reload if needed
        const state = useAppStore.getState();
        if (!state.catalogsLoaded) {
          const [tasks, rewards] = await Promise.all([
            fetchFamilyTasks().catch(() => []),
            fetchFamilyRewards().catch(() => []),
          ]);
          if (!cancelled) {
            useAppStore.setState({ tasks, rewards, catalogsLoaded: true });
          }
        }
        if (!cancelled) setChecked(true);
        return;
      }

      // Store is empty — check if Supabase session exists (hard refresh case)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No session at all — go to login
        if (!cancelled) router.replace(`/${locale}/login`);
        return;
      }

      // Session valid — restore everything from server
      try {
        const profiles = await fetchFamilyProfiles();
        if (cancelled || profiles.length === 0) return;

        const myProfile = profiles.find((p) => p.authUserId === user.id);
        if (!myProfile) {
          router.replace(`/${locale}/login`);
          return;
        }

        const [familySettings, flags] = await Promise.all([
          fetchFamilySettings(myProfile.familyId),
          fetchFamilyFeatureFlags(myProfile.familyId),
        ]);
        const store = useAppStore.getState();
        store.initRealAuth(profiles, myProfile, familySettings.name);
        // Set features AFTER initRealAuth (which resets featuresUnlocked)
        const features: string[] = [];
        if (flags.petsEnabled) features.push("pets");
        if (flags.minigameEnabled) features.push("minigame");
        useAppStore.setState({
          onboardingCompleted: familySettings.onboardingCompleted,
          setupVisited: familySettings.setupVisited,
          featuresUnlocked: features,
        });

        const [tasks, rewards] = await Promise.all([
          fetchFamilyTasks().catch(() => []),
          fetchFamilyRewards().catch(() => []),
        ]);
        useAppStore.setState({ tasks, rewards, catalogsLoaded: true });
        useMultipliersStore.getState().reset();
      } catch {
        router.replace(`/${locale}/login`);
        return;
      }

      if (!cancelled) setChecked(true);
    }

    verify();
    return () => { cancelled = true; };
  }, [currentUser, locale, router]);

  // While checking, show a loading spinner
  if (!checked && !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
