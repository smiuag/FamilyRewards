"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_MULTIPLIERS, type PointMultiplier } from "@/lib/multipliers";

interface MultipliersState {
  multipliers: PointMultiplier[];
  addMultiplier: (m: PointMultiplier) => void;
  updateMultiplier: (id: string, patch: Partial<PointMultiplier>) => void;
  deleteMultiplier: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useMultipliersStore = create<MultipliersState>()(
  persist(
    (set) => ({
      multipliers: MOCK_MULTIPLIERS,

      addMultiplier: (m) =>
        set((s) => ({ multipliers: [...s.multipliers, m] })),

      updateMultiplier: (id, patch) =>
        set((s) => ({
          multipliers: s.multipliers.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      deleteMultiplier: (id) =>
        set((s) => ({ multipliers: s.multipliers.filter((m) => m.id !== id) })),

      toggleActive: (id) =>
        set((s) => ({
          multipliers: s.multipliers.map((m) =>
            m.id === id ? { ...m, isActive: !m.isActive } : m
          ),
        })),
    }),
    { name: "family-rewards-multipliers" }
  )
);
