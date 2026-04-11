import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "family-rewards-theme",
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown> | undefined;
        const theme = state?.theme;
        return {
          theme: theme === "light" || theme === "dark" ? theme : "light",
        } as ThemeStore;
      },
    }
  )
);
