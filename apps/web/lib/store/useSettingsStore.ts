"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  postalCode: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  setLocation: (country: string, region: string, city: string) => void;
  setPostalCode: (postalCode: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      postalCode: "28001",
      country: "ES",
      region: "ES-MD",
      city: "Madrid",
      timezone: "Europe/Madrid",
      setLocation: (country, region, city) =>
        set({ country, region, city }),
      setPostalCode: (postalCode) => set({ postalCode }),
    }),
    { name: "family-rewards-settings" }
  )
);
