"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MinigameConfig } from "@/lib/types";
import type { RankingEntry } from "@/lib/api/minigame";

interface MinigameState {
  config: MinigameConfig | null;
  todayGamesPlayed: number;
  todayDate: string; // "YYYY-MM-DD" for auto-reset
  weeklyRanking: RankingEntry[];

  loadConfig: (config: MinigameConfig) => void;
  setTodayGames: (count: number) => void;
  incrementTodayGames: () => void;
  loadWeeklyRanking: (ranking: RankingEntry[]) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useMinigameStore = create<MinigameState>()(
  persist(
    (set, get) => ({
      config: null,
      todayGamesPlayed: 0,
      todayDate: todayStr(),
      weeklyRanking: [],

      loadConfig: (config) => set({ config }),

      setTodayGames: (count) =>
        set({ todayGamesPlayed: count, todayDate: todayStr() }),

      incrementTodayGames: () => {
        const state = get();
        const today = todayStr();
        // Auto-reset if day changed
        if (state.todayDate !== today) {
          set({ todayGamesPlayed: 1, todayDate: today });
        } else {
          set({ todayGamesPlayed: state.todayGamesPlayed + 1 });
        }
      },

      loadWeeklyRanking: (ranking) => set({ weeklyRanking: ranking }),
    }),
    {
      name: "family-rewards-minigame-store",
      partialize: (state) => ({
        config: state.config,
        todayGamesPlayed: state.todayGamesPlayed,
        todayDate: state.todayDate,
      }),
    },
  ),
);
