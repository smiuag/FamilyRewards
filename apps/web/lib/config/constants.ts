import type { DayOfWeek } from "@/lib/types";

// ── Difficulty (tasks) ─────────────────────────────────────
export const DIFFICULTY_CONFIG = {
  easy:   { label: "Fácil",   color: "bg-green-100 text-green-700" },
  medium: { label: "Normal",  color: "bg-amber-100 text-amber-700" },
  hard:   { label: "Difícil", color: "bg-red-100 text-red-700" },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_CONFIG;

// ── Tier (rewards) ─────────────────────────────────────────
export const TIER_CONFIG = {
  easy:   { label: "Fácil",   color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  medium: { label: "Normal",  color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  hard:   { label: "Difícil", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  epic:   { label: "Épico",   color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
} as const;

export type Tier = keyof typeof TIER_CONFIG;

// ── Days ───────────────────────────────────────────────────
export const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D",
};
export const DAY_NAMES: Record<DayOfWeek, string> = {
  mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo",
};

// ── Thresholds ─────────────────────────────────────────────
export const COMPLETION_RATE_GOOD = 80;
export const COMPLETION_RATE_OK = 50;
export const STREAK_HIGHLIGHT_THRESHOLD = 7;
export const MAX_STREAK_LOOKBACK_DAYS = 365;

// ── Point limits ───────────────────────────────────────────
export const MAX_REWARD_POINTS = 20_000;
export const MULTIPLIER_MIN = 1.5;
export const MULTIPLIER_MAX = 10;

// ── Streak calculation ─────────────────────────────────────
/**
 * Count consecutive days (ending today) that appear in `completedDays`.
 * If today has no entry, streak is 0.
 */
export function calculateCurrentStreak(completedDays: Set<string>): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (completedDays.has(ds)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
