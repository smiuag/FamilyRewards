"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PinState {
  // Map profileId → hashed PIN (simple hash, local only)
  pins: Record<string, string>;
  setPin: (profileId: string, pin: string) => void;
  removePin: (profileId: string) => void;
  hasPin: (profileId: string) => boolean;
  verifyPin: (profileId: string, pin: string) => boolean;
}

// Simple hash for local PIN storage (not security-critical — just prevents casual access)
function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  }
  return String(h);
}

export const usePinStore = create<PinState>()(
  persist(
    (set, get) => ({
      pins: {},
      setPin: (profileId, pin) =>
        set((prev) => ({ pins: { ...prev.pins, [profileId]: hashPin(pin) } })),
      removePin: (profileId) =>
        set((prev) => {
          const { [profileId]: _, ...rest } = prev.pins;
          return { pins: rest };
        }),
      hasPin: (profileId) => !!get().pins[profileId],
      verifyPin: (profileId, pin) => get().pins[profileId] === hashPin(pin),
    }),
    { name: "family-rewards-pins" }
  )
);
