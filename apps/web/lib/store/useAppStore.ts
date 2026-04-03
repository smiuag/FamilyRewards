"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TaskInstance, RewardClaim } from "@/lib/types";
import {
  MOCK_USERS,
  MOCK_TASK_INSTANCES,
  MOCK_CLAIMS,
} from "@/lib/mock-data";

interface AppState {
  // Current user session
  currentUser: User | null;
  users: User[];

  // Task instances (daily state)
  taskInstances: TaskInstance[];

  // Reward claims
  claims: RewardClaim[];

  // Actions
  login: (userId: string) => void;
  logout: () => void;
  updateTaskInstance: (instanceId: string, state: TaskInstance["state"]) => void;
  addClaim: (claim: RewardClaim) => void;
  updateClaim: (claimId: string, status: RewardClaim["status"]) => void;
  adjustPoints: (userId: string, amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      taskInstances: MOCK_TASK_INSTANCES,
      claims: MOCK_CLAIMS,

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId) ?? null;
        set({ currentUser: user });
      },

      logout: () => set({ currentUser: null }),

      updateTaskInstance: (instanceId, state) => {
        set((prev) => {
          const instances = prev.taskInstances.map((ti) => {
            if (ti.id !== instanceId) return ti;
            // Find the task to know its points
            const pointsAwarded = state === "completed" ? ti.pointsAwarded || 0 : 0;
            return { ...ti, state, pointsAwarded };
          });

          // Recalculate user points balance
          const users = prev.users.map((u) => {
            const earned = instances
              .filter((ti) => ti.userId === u.id && ti.state === "completed")
              .reduce((acc, ti) => acc + ti.pointsAwarded, 0);
            // Keep existing balance logic simple for mock
            return u;
          });

          return { taskInstances: instances, users };
        });
      },

      addClaim: (claim) =>
        set((prev) => ({ claims: [...prev.claims, claim] })),

      updateClaim: (claimId, status) =>
        set((prev) => ({
          claims: prev.claims.map((c) =>
            c.id === claimId
              ? { ...c, status, resolvedAt: new Date().toISOString() }
              : c
          ),
        })),

      adjustPoints: (userId, amount) =>
        set((prev) => ({
          users: prev.users.map((u) =>
            u.id === userId
              ? { ...u, pointsBalance: Math.max(0, u.pointsBalance + amount) }
              : u
          ),
          currentUser:
            prev.currentUser?.id === userId
              ? {
                  ...prev.currentUser,
                  pointsBalance: Math.max(
                    0,
                    prev.currentUser.pointsBalance + amount
                  ),
                }
              : prev.currentUser,
        })),
    }),
    {
      name: "family-rewards-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        taskInstances: state.taskInstances,
        claims: state.claims,
      }),
    }
  )
);
