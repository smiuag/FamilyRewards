"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_CHALLENGES, type FamilyChallenge, type ChallengeStatus } from "@/lib/challenges";

interface ChallengesState {
  challenges: FamilyChallenge[];
  addChallenge: (challenge: FamilyChallenge) => void;
  contribute: (challengeId: string, userId: string, amount: number) => void;
  updateStatus: (challengeId: string, status: ChallengeStatus) => void;
  deleteChallenge: (challengeId: string) => void;
}

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set) => ({
      challenges: MOCK_CHALLENGES,

      addChallenge: (challenge) =>
        set((s) => ({ challenges: [...s.challenges, challenge] })),

      contribute: (challengeId, userId, amount) =>
        set((s) => ({
          challenges: s.challenges.map((c) => {
            if (c.id !== challengeId) return c;
            const existing = c.contributions.find((con) => con.userId === userId);
            const newContributions = existing
              ? c.contributions.map((con) =>
                  con.userId === userId
                    ? { ...con, amount: con.amount + amount }
                    : con
                )
              : [...c.contributions, { userId, amount }];
            const newProgress = newContributions.reduce((sum, con) => sum + con.amount, 0);
            const status: ChallengeStatus =
              newProgress >= c.goalTarget ? "completed" : c.status;
            return {
              ...c,
              contributions: newContributions,
              currentProgress: Math.min(newProgress, c.goalTarget),
              status,
            };
          }),
        })),

      updateStatus: (challengeId, status) =>
        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === challengeId ? { ...c, status } : c
          ),
        })),

      deleteChallenge: (challengeId) =>
        set((s) => ({
          challenges: s.challenges.filter((c) => c.id !== challengeId),
        })),
    }),
    { name: "family-rewards-challenges" }
  )
);
