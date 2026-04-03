"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  country: string;
  region: string;
  city: string;
  timezone: string;
  setLocation: (country: string, region: string, city: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      country: "ES",
      region: "ES-MD",
      city: "Madrid",
      timezone: "Europe/Madrid",
      setLocation: (country, region, city) =>
        set({ country, region, city }),
    }),
    { name: "family-rewards-settings" }
  )
);
