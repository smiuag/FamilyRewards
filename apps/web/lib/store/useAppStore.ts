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
  checkAndAwardStreakBonus: (userId: string) => { streak: number; bonus: number };
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

      updateTaskInstance: (instanceId, newState) => {
        set((prev) => {
          const oldInstance = prev.taskInstances.find((ti) => ti.id === instanceId);
          if (!oldInstance) return {};

          const wasCompleted = oldInstance.state === "completed";
          const isNowCompleted = newState === "completed";
          const pointsDelta = isNowCompleted
            ? oldInstance.pointsAwarded || 0
            : wasCompleted
            ? -(oldInstance.pointsAwarded || 0)
            : 0;

          const instances = prev.taskInstances.map((ti) =>
            ti.id === instanceId ? { ...ti, state: newState } : ti
          );

          const users = prev.users.map((u) =>
            u.id === oldInstance.userId
              ? { ...u, pointsBalance: Math.max(0, u.pointsBalance + pointsDelta) }
              : u
          );

          const currentUser =
            prev.currentUser?.id === oldInstance.userId
              ? {
                  ...prev.currentUser,
                  pointsBalance: Math.max(
                    0,
                    prev.currentUser.pointsBalance + pointsDelta
                  ),
                }
              : prev.currentUser;

          return { taskInstances: instances, users, currentUser };
        });
      },

      checkAndAwardStreakBonus: (userId: string) => {
        const { taskInstances, users } = get();
        // Count consecutive days with at least one completed task
        const completedDates = new Set(
          taskInstances
            .filter((ti) => ti.userId === userId && ti.state === "completed")
            .map((ti) => ti.date)
        );
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          if (completedDates.has(dateStr)) {
            streak++;
          } else {
            break;
          }
        }
        // Award bonus at 7, 14, 21, 30-day milestones
        const MILESTONES: Record<number, number> = { 7: 50, 14: 100, 21: 150, 30: 250 };
        if (MILESTONES[streak]) {
          const bonus = MILESTONES[streak];
          set((prev) => ({
            users: prev.users.map((u) =>
              u.id === userId
                ? { ...u, pointsBalance: u.pointsBalance + bonus }
                : u
            ),
            currentUser:
              prev.currentUser?.id === userId
                ? {
                    ...prev.currentUser,
                    pointsBalance: prev.currentUser.pointsBalance + bonus,
                  }
                : prev.currentUser,
          }));
          return { streak, bonus };
        }
        return { streak, bonus: 0 };
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
