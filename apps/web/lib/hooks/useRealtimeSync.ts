"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, backfillInstances, fetchClaimedInstances } from "@/lib/api/tasks";
import { fetchFamilyRewards, fetchFamilyClaims } from "@/lib/api/rewards";
import { fetchFamilyProfiles } from "@/lib/api/members";

/**
 * Subscribes to Supabase Realtime changes on key tables.
 * When another user changes data, the store is refreshed.
 */
export function useRealtimeSync() {
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    if (!currentUser) return;

    const supabase = createClient();

    const channel = supabase
      .channel("family-sync")
      // task_instances changes (someone completed/failed a task)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_instances" },
        async () => {
          const tasks = useAppStore.getState().tasks.length > 0
            ? useAppStore.getState().tasks
            : await fetchFamilyTasks();
          const today = new Date().toISOString().split("T")[0];
          const myInstances = await backfillInstances(tasks, currentUser.id, new Date());
          // Also fetch claimed instances for unassigned tasks (so claimable status updates)
          const unassignedTaskIds = tasks
            .filter((t) => t.assignedTo.length === 0 && t.isActive)
            .map((t) => t.id);
          const claimedInstances = await fetchClaimedInstances(unassignedTaskIds, today);
          // Merge: my instances + claimed by others (dedup by id)
          const allIds = new Set(myInstances.map((i) => i.id));
          const merged = [
            ...myInstances,
            ...claimedInstances.filter((i) => !allIds.has(i.id)),
          ];
          useAppStore.setState((prev) => ({
            tasks,
            taskInstances: [
              ...prev.taskInstances.filter((ti) =>
                ti.userId !== currentUser.id && !unassignedTaskIds.includes(ti.taskId)
              ),
              ...merged,
            ],
          }));
        }
      )
      // reward_claims changes (admin approved/rejected a claim)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reward_claims" },
        async () => {
          const claims = await fetchFamilyClaims().catch(() => []);
          useAppStore.setState({ claims });
        }
      )
      // profiles changes (points updated, member added/removed)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async () => {
          const profiles = await fetchFamilyProfiles().catch(() => []);
          if (profiles.length > 0) {
            const me = profiles.find((p) => p.id === currentUser.id);
            useAppStore.setState((prev) => ({
              users: profiles,
              currentUser: me ?? prev.currentUser,
            }));
          }
        }
      )
      // rewards changes (new reward, price change, etc.)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rewards" },
        async () => {
          const rewards = await fetchFamilyRewards().catch(() => []);
          useAppStore.setState({ rewards });
        }
      )
      // tasks changes (new task, edited, deactivated)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async () => {
          const tasks = await fetchFamilyTasks().catch(() => []);
          useAppStore.setState({ tasks });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);
}
