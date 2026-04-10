"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Task, TaskInstance, Reward, RewardClaim, PointsTransaction } from "@/lib/types";

interface AppState {
  // Session
  currentUser: User | null;
  users: User[];
  familyName: string;

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

  // Setup guidance (! badges en sidebar)
  setupVisited: { members: boolean; catalogTasks: boolean; catalogRewards: boolean };
  markSetupVisited: (section: "members" | "catalogTasks" | "catalogRewards") => void;

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

  setFamilyName: (name: string) => void;

  // Inicializa el store con datos reales de Supabase, borrando todo el mock data
  initRealAuth: (profiles: User[], selectedProfile: User, familyName?: string) => void;

  loadTasks: (tasks: Task[]) => void;
  loadTaskInstances: (instances: TaskInstance[]) => void;
  loadRewards: (rewards: Reward[]) => void;
  loadClaims: (claims: RewardClaim[]) => void;
  loadTransactions: (transactions: PointsTransaction[]) => void;

  updateMember: (id: string, patch: Partial<User>) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateReward: (rewardId: string, patch: Partial<Reward>) => void;
  deleteReward: (rewardId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      familyName: "Mi familia",
      tasks: [],
      taskInstances: [],
      rewards: [],
      claims: [],
      transactions: [],
      onboardingCompleted: false,
      setupVisited: { members: false, catalogTasks: false, catalogRewards: false },
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

      setFamilyName: (name) => set({ familyName: name }),

      // Limpia todo el mock data e inicializa con datos reales de Supabase
      // onboardingCompleted y setupVisited se cargan aparte desde la BD
      initRealAuth: (profiles, selectedProfile, familyName) => set({
        currentUser: selectedProfile,
        users: profiles,
        familyName: familyName ?? "Mi familia",
        tasks: [],
        taskInstances: [],
        rewards: [],
        claims: [],
        transactions: [],
        targetRewardIds: [],
        archivedClaimIds: [],
        featuresUnlocked: [],
        streakAlert: null,
      }),

      completeOnboarding: () => {
        const familyId = get().currentUser?.familyId;
        set({ onboardingCompleted: true });
        if (familyId) {
          import("@/lib/api/members").then(({ updateFamilyOnboarding }) =>
            updateFamilyOnboarding(familyId, true).catch(() => {})
          );
        }
      },

      loadTasks: (tasks) => set({ tasks }),
      loadTaskInstances: (instances) => set({ taskInstances: instances }),
      loadRewards: (rewards) => set({ rewards }),
      loadClaims: (claims) => set({ claims }),
      loadTransactions: (transactions) => set({ transactions }),

      markSetupVisited: (section) => {
        const familyId = get().currentUser?.familyId;
        set((prev) => ({
          setupVisited: { ...prev.setupVisited, [section]: true },
        }));
        if (familyId) {
          import("@/lib/api/members").then(({ updateFamilySetupVisited }) =>
            updateFamilySetupVisited(familyId, section).catch(() => {})
          );
        }
      },

      updateTaskInstance: (instanceId, newState) => {
        set((prev) => {
          const oldInstance = prev.taskInstances.find((ti) => ti.id === instanceId);
          if (!oldInstance) return {};

          const task = prev.tasks.find((t) => t.id === oldInstance.taskId);
          const penalty = task?.penaltyPoints ?? task?.points ?? 0;

          // Points awarded for each state
          const pointsForState = (s: typeof newState) =>
            s === "completed" ? (task?.points ?? 0) :
            s === "failed"    ? -penalty :
            0;

          const pointsDelta = pointsForState(newState) - pointsForState(oldInstance.state);

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
            newState === "completed" &&
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
              description:
                newState === "completed" ? `Tarea completada: ${task?.title ?? "Tarea"}` :
                newState === "failed"    ? `Tarea no realizada: ${task?.title ?? "Tarea"}` :
                newState === "cancelled" ? `Tarea cancelada: ${task?.title ?? "Tarea"}` :
                                          `Tarea revertida: ${task?.title ?? "Tarea"}`,
              emoji: newState === "completed" ? "✅" : newState === "failed" ? "❌" : "↩️",
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

      updateMember: (id, patch) =>
        set((prev) => ({
          users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          currentUser:
            prev.currentUser?.id === id
              ? { ...prev.currentUser, ...patch }
              : prev.currentUser,
        })),

      updateTask: (taskId, patch) =>
        set((prev) => ({
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        })),

      deleteTask: (taskId) =>
        set((prev) => ({
          tasks: prev.tasks.filter((t) => t.id !== taskId),
          // taskInstances are kept intentionally for history/reports
        })),

      updateReward: (rewardId, patch) =>
        set((prev) => ({
          rewards: prev.rewards.map((r) => (r.id === rewardId ? { ...r, ...patch } : r)),
        })),

      deleteReward: (rewardId) =>
        set((prev) => ({
          rewards: prev.rewards.filter((r) => r.id !== rewardId),
          // claims are kept intentionally for history
        })),
    }),
    {
      name: "family-rewards-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        familyName: state.familyName,
        tasks: state.tasks,
        taskInstances: state.taskInstances,
        rewards: state.rewards,
        claims: state.claims,
        targetRewardIds: state.targetRewardIds,
        archivedClaimIds: state.archivedClaimIds,
        featuresUnlocked: state.featuresUnlocked,
        transactions: state.transactions,
      }),
    }
  )
);
