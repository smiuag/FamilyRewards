"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/useThemeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
