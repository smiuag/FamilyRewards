"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Task, TaskInstance, Reward, RewardClaim } from "@/lib/types";
import {
  MOCK_USERS,
  MOCK_TASKS,
  MOCK_TASK_INSTANCES,
  MOCK_CLAIMS,
  MOCK_REWARDS,
} from "@/lib/mock-data";

interface AppState {
  // Session
  currentUser: User | null;
  users: User[];

  // Tasks
  tasks: Task[];
  taskInstances: TaskInstance[];

  // Rewards
  rewards: Reward[];
  claims: RewardClaim[];

  // Onboarding
  onboardingCompleted: boolean;

  // Actions
  login: (userId: string) => void;
  logout: () => void;
  completeOnboarding: () => void;

  updateTaskInstance: (instanceId: string, state: TaskInstance["state"]) => void;
  checkAndAwardStreakBonus: (userId: string) => { streak: number; bonus: number };

  addClaim: (claim: RewardClaim) => void;
  updateClaim: (claimId: string, status: RewardClaim["status"]) => void;
  adjustPoints: (userId: string, amount: number) => void;

  addMember: (member: Omit<User, "id" | "familyId" | "createdAt">) => void;
  addTask: (task: Omit<Task, "id" | "familyId" | "createdAt">) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  addReward: (reward: Omit<Reward, "id" | "familyId">) => void;
  updateReward: (rewardId: string, patch: Partial<Reward>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      tasks: MOCK_TASKS,
      taskInstances: MOCK_TASK_INSTANCES,
      rewards: MOCK_REWARDS,
      claims: MOCK_CLAIMS,
      onboardingCompleted: false,

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId) ?? null;
        set({ currentUser: user });
      },

      logout: () => set({ currentUser: null }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

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
                  pointsBalance: Math.max(0, prev.currentUser.pointsBalance + pointsDelta),
                }
              : prev.currentUser;

          return { taskInstances: instances, users, currentUser };
        });
      },

      checkAndAwardStreakBonus: (userId) => {
        const { taskInstances, users } = get();
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
          if (completedDates.has(dateStr)) streak++;
          else break;
        }
        const MILESTONES: Record<number, number> = { 7: 50, 14: 100, 21: 150, 30: 250 };
        if (MILESTONES[streak]) {
          const bonus = MILESTONES[streak];
          set((prev) => ({
            users: prev.users.map((u) =>
              u.id === userId ? { ...u, pointsBalance: u.pointsBalance + bonus } : u
            ),
            currentUser:
              prev.currentUser?.id === userId
                ? { ...prev.currentUser, pointsBalance: prev.currentUser.pointsBalance + bonus }
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
            c.id === claimId ? { ...c, status, resolvedAt: new Date().toISOString() } : c
          ),
        })),

      adjustPoints: (userId, amount) =>
        set((prev) => ({
          users: prev.users.map((u) =>
            u.id === userId ? { ...u, pointsBalance: Math.max(0, u.pointsBalance + amount) } : u
          ),
          currentUser:
            prev.currentUser?.id === userId
              ? { ...prev.currentUser, pointsBalance: Math.max(0, prev.currentUser.pointsBalance + amount) }
              : prev.currentUser,
        })),

      addMember: (member) =>
        set((prev) => ({
          users: [
            ...prev.users,
            {
              ...member,
              id: `u-${Date.now()}`,
              familyId: "f1",
              createdAt: new Date().toISOString().split("T")[0],
            },
          ],
        })),

      addTask: (task) =>
        set((prev) => ({
          tasks: [
            ...prev.tasks,
            {
              ...task,
              id: `t-${Date.now()}`,
              familyId: "f1",
              createdAt: new Date().toISOString().split("T")[0],
            },
          ],
        })),

      updateTask: (taskId, patch) =>
        set((prev) => ({
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        })),

      addReward: (reward) =>
        set((prev) => ({
          rewards: [
            ...prev.rewards,
            {
              ...reward,
              id: `r-${Date.now()}`,
              familyId: "f1",
            },
          ],
        })),

      updateReward: (rewardId, patch) =>
        set((prev) => ({
          rewards: prev.rewards.map((r) => (r.id === rewardId ? { ...r, ...patch } : r)),
        })),
    }),
    {
      name: "family-rewards-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        tasks: state.tasks,
        taskInstances: state.taskInstances,
        rewards: state.rewards,
        claims: state.claims,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
