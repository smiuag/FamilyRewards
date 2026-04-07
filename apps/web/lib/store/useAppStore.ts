"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Task, TaskInstance, Reward, RewardClaim, PointsTransaction } from "@/lib/types";
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

  // Points history
  transactions: PointsTransaction[];

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
  adjustPoints: (userId: string, amount: number, description?: string) => void;

  targetRewardIds: string[];
  toggleTargetReward: (rewardId: string) => void;

  archivedClaimIds: string[];
  archiveClaim: (claimId: string) => void;

  featuresUnlocked: string[];
  unlockFeature: (feature: string) => void;

  streakAlert: { userId: string; userName: string; days: number } | null;
  clearStreakAlert: () => void;

  setCurrentProfile: (profile: User) => void;

  // Inicializa el store con datos reales de Supabase, borrando todo el mock data
  initRealAuth: (profiles: User[], selectedProfile: User) => void;

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
      transactions: [],
      onboardingCompleted: false,
      targetRewardIds: [],
      archivedClaimIds: [],
      featuresUnlocked: [],
      streakAlert: null,

      login: (userId) => {
        const user = get().users.find((u) => u.id === userId) ?? null;
        set({ currentUser: user });
      },

      logout: () => set({ currentUser: null }),

      // Establece el perfil activo a partir de datos reales de Supabase
      setCurrentProfile: (profile) => set({ currentUser: profile }),

      // Limpia todo el mock data e inicializa con datos reales de Supabase
      initRealAuth: (profiles, selectedProfile) => set({
        currentUser: selectedProfile,
        users: profiles,
        tasks: [],
        taskInstances: [],
        rewards: [],
        claims: [],
        transactions: [],
        onboardingCompleted: false,
        targetRewardIds: [],
        archivedClaimIds: [],
        featuresUnlocked: [],
        streakAlert: null,
      }),

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

          // Check for 7-day streak milestone to unlock "streaks" feature
          let streakAlert = prev.streakAlert;
          if (
            isNowCompleted &&
            !prev.featuresUnlocked.includes("streaks") &&
            prev.currentUser?.role === "admin"
          ) {
            const userId = oldInstance.userId;
            const today = new Date();
            let streak = 0;
            for (let i = 0; i < 30; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              const dateStr = d.toISOString().split("T")[0];
              const dayInstances = instances.filter((ti) => ti.userId === userId && ti.date === dateStr);
              if (dayInstances.length === 0) break;
              if (dayInstances.every((ti) => ti.state === "completed")) streak++;
              else break;
            }
            if (streak >= 7) {
              const userName = prev.users.find((u) => u.id === userId)?.name ?? "Usuario";
              streakAlert = { userId, userName, days: streak };
            }
          }

          // Record transaction
          const newTransactions = [...prev.transactions];
          if (pointsDelta !== 0) {
            const updatedUser = users.find((u) => u.id === oldInstance.userId);
            const task = prev.tasks.find((t) => t.id === oldInstance.taskId);
            newTransactions.push({
              id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              userId: oldInstance.userId,
              amount: pointsDelta,
              type: "task",
              description: pointsDelta > 0
                ? `Tarea completada: ${task?.title ?? "Tarea"}`
                : `Tarea desmarcada: ${task?.title ?? "Tarea"}`,
              emoji: pointsDelta > 0 ? "✅" : "↩️",
              createdAt: new Date().toISOString(),
              balanceAfter: updatedUser?.pointsBalance ?? 0,
            });
          }

          return { taskInstances: instances, users, currentUser, streakAlert, transactions: newTransactions };
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
        set((prev) => {
          const newClaims = [...prev.claims, claim];
          if (claim.status !== "approved") return { claims: newClaims };

          // Auto-approved (admin redeeming): deduct points + record transaction
          const reward = prev.rewards.find((r) => r.id === claim.rewardId);
          const cost = reward?.pointsCost ?? 0;
          const users = prev.users.map((u) =>
            u.id === claim.userId ? { ...u, pointsBalance: Math.max(0, u.pointsBalance - cost) } : u
          );
          const currentUser =
            prev.currentUser?.id === claim.userId
              ? { ...prev.currentUser, pointsBalance: Math.max(0, prev.currentUser.pointsBalance - cost) }
              : prev.currentUser;
          const updatedUser = users.find((u) => u.id === claim.userId);
          const tx: PointsTransaction = {
            id: `tx-${Date.now()}`,
            userId: claim.userId,
            amount: -cost,
            type: "reward",
            description: `Recompensa canjeada: ${reward?.title ?? "Recompensa"}`,
            emoji: reward?.emoji ?? "🎁",
            createdAt: new Date().toISOString(),
            balanceAfter: updatedUser?.pointsBalance ?? 0,
          };
          return { claims: newClaims, users, currentUser, transactions: [...prev.transactions, tx] };
        }),

      updateClaim: (claimId, status) =>
        set((prev) => {
          const claim = prev.claims.find((c) => c.id === claimId);
          const claims = prev.claims.map((c) =>
            c.id === claimId ? { ...c, status, resolvedAt: new Date().toISOString() } : c
          );

          if (status !== "approved" || !claim) return { claims };

          const reward = prev.rewards.find((r) => r.id === claim.rewardId);
          const cost = reward?.pointsCost ?? 0;

          const users = prev.users.map((u) =>
            u.id === claim.userId
              ? { ...u, pointsBalance: Math.max(0, u.pointsBalance - cost) }
              : u
          );
          const currentUser =
            prev.currentUser?.id === claim.userId
              ? { ...prev.currentUser, pointsBalance: Math.max(0, prev.currentUser.pointsBalance - cost) }
              : prev.currentUser;

          const updatedUser = users.find((u) => u.id === claim.userId);
          const tx: PointsTransaction = {
            id: `tx-${Date.now()}`,
            userId: claim.userId,
            amount: -cost,
            type: "reward",
            description: `Recompensa canjeada: ${reward?.title ?? "Recompensa"}`,
            emoji: reward?.emoji ?? "🎁",
            createdAt: new Date().toISOString(),
            balanceAfter: updatedUser?.pointsBalance ?? 0,
          };

          return { claims, users, currentUser, transactions: [...prev.transactions, tx] };
        }),

      adjustPoints: (userId, amount, description?: string) =>
        set((prev) => {
          const users = prev.users.map((u) =>
            u.id === userId ? { ...u, pointsBalance: Math.max(0, u.pointsBalance + amount) } : u
          );
          const currentUser =
            prev.currentUser?.id === userId
              ? { ...prev.currentUser, pointsBalance: Math.max(0, prev.currentUser.pointsBalance + amount) }
              : prev.currentUser;
          const updatedUser = users.find((u) => u.id === userId);
          const tx: PointsTransaction = {
            id: `tx-${Date.now()}`,
            userId,
            amount,
            type: amount > 0 && description?.includes("racha") ? "streak" : "adjustment",
            description: description ?? (amount > 0 ? "Ajuste manual positivo" : "Ajuste manual"),
            emoji: amount > 0 ? (description?.includes("racha") ? "🔥" : "⭐") : "➖",
            createdAt: new Date().toISOString(),
            balanceAfter: updatedUser?.pointsBalance ?? 0,
          };
          return { users, currentUser, transactions: [...prev.transactions, tx] };
        }),

      toggleTargetReward: (rewardId) =>
        set((prev) => ({
          targetRewardIds: prev.targetRewardIds.includes(rewardId)
            ? prev.targetRewardIds.filter((id) => id !== rewardId)
            : [...prev.targetRewardIds, rewardId],
        })),

      archiveClaim: (claimId) =>
        set((prev) => ({
          archivedClaimIds: prev.archivedClaimIds.includes(claimId)
            ? prev.archivedClaimIds
            : [...prev.archivedClaimIds, claimId],
        })),

      unlockFeature: (feature) =>
        set((prev) => ({
          featuresUnlocked: prev.featuresUnlocked.includes(feature)
            ? prev.featuresUnlocked
            : [...prev.featuresUnlocked, feature],
        })),

      clearStreakAlert: () => set({ streakAlert: null }),

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
        targetRewardIds: state.targetRewardIds,
        archivedClaimIds: state.archivedClaimIds,
        featuresUnlocked: state.featuresUnlocked,
        transactions: state.transactions,
      }),
    }
  )
);
