export type AchievementCategory = "streak" | "tasks" | "rewards" | "social" | "special";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  condition: (stats: UserStats) => boolean;
  points: number; // bonus points awarded on unlock
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserStats {
  totalTasksCompleted: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  rewardsClaimed: number;
  perfectWeeks: number; // weeks with 100% completion
  totalPointsEarned: number;
  daysActive: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Racha ──────────────────────────────────────────────────
  {
    id: "streak_3",
    title: "Primeros pasos",
    description: "3 días seguidos completando tareas",
    emoji: "🔥",
    category: "streak",
    condition: (s) => s.currentStreak >= 3,
    points: 50,
    rarity: "common",
  },
  {
    id: "streak_7",
    title: "Una semana completa",
    description: "7 días seguidos sin fallar",
    emoji: "⚡",
    category: "streak",
    condition: (s) => s.currentStreak >= 7,
    points: 150,
    rarity: "common",
  },
  {
    id: "streak_14",
    title: "Dos semanas imparable",
    description: "14 días de racha consecutiva",
    emoji: "💪",
    category: "streak",
    condition: (s) => s.currentStreak >= 14,
    points: 300,
    rarity: "rare",
  },
  {
    id: "streak_30",
    title: "Mes perfecto",
    description: "30 días seguidos completando tareas",
    emoji: "🏆",
    category: "streak",
    condition: (s) => s.currentStreak >= 30,
    points: 750,
    rarity: "epic",
  },
  {
    id: "streak_100",
    title: "Centenario",
    description: "100 días de racha. ¡Increíble!",
    emoji: "💎",
    category: "streak",
    condition: (s) => s.currentStreak >= 100,
    points: 2000,
    rarity: "legendary",
  },

  // ── Tareas ──────────────────────────────────────────────────
  {
    id: "tasks_10",
    title: "Aprendiz",
    description: "Completa 10 tareas en total",
    emoji: "✅",
    category: "tasks",
    condition: (s) => s.totalTasksCompleted >= 10,
    points: 30,
    rarity: "common",
  },
  {
    id: "tasks_50",
    title: "Trabajador",
    description: "50 tareas completadas",
    emoji: "🛠️",
    category: "tasks",
    condition: (s) => s.totalTasksCompleted >= 50,
    points: 100,
    rarity: "common",
  },
  {
    id: "tasks_100",
    title: "Centurión",
    description: "100 tareas completadas",
    emoji: "⚔️",
    category: "tasks",
    condition: (s) => s.totalTasksCompleted >= 100,
    points: 250,
    rarity: "rare",
  },
  {
    id: "tasks_500",
    title: "Leyenda de las tareas",
    description: "500 tareas completadas. Eres una leyenda.",
    emoji: "🌟",
    category: "tasks",
    condition: (s) => s.totalTasksCompleted >= 500,
    points: 1000,
    rarity: "legendary",
  },
  {
    id: "perfect_week",
    title: "Semana perfecta",
    description: "Completa todas las tareas una semana entera",
    emoji: "🎯",
    category: "tasks",
    condition: (s) => s.perfectWeeks >= 1,
    points: 200,
    rarity: "rare",
  },
  {
    id: "perfect_weeks_4",
    title: "Mes sin fallos",
    description: "4 semanas perfectas consecutivas",
    emoji: "👑",
    category: "tasks",
    condition: (s) => s.perfectWeeks >= 4,
    points: 500,
    rarity: "epic",
  },

  // ── Recompensas ─────────────────────────────────────────────
  {
    id: "first_reward",
    title: "Primera recompensa",
    description: "Canjea tu primera recompensa",
    emoji: "🎁",
    category: "rewards",
    condition: (s) => s.rewardsClaimed >= 1,
    points: 50,
    rarity: "common",
  },
  {
    id: "rewards_5",
    title: "Coleccionista",
    description: "5 recompensas canjeadas",
    emoji: "🎀",
    category: "rewards",
    condition: (s) => s.rewardsClaimed >= 5,
    points: 200,
    rarity: "rare",
  },
  {
    id: "big_spender",
    title: "Gran canje",
    description: "Canjea una recompensa de más de 2000 puntos",
    emoji: "💰",
    category: "rewards",
    condition: (s) => s.rewardsClaimed >= 1 && s.totalPoints >= 2000,
    points: 300,
    rarity: "rare",
  },

  // ── Puntos ──────────────────────────────────────────────────
  {
    id: "points_500",
    title: "Ahorrador",
    description: "Acumula 500 puntos",
    emoji: "💵",
    category: "special",
    condition: (s) => s.totalPointsEarned >= 500,
    points: 0,
    rarity: "common",
  },
  {
    id: "points_2000",
    title: "Rico en puntos",
    description: "Acumula 2000 puntos en total",
    emoji: "💎",
    category: "special",
    condition: (s) => s.totalPointsEarned >= 2000,
    points: 100,
    rarity: "rare",
  },
  {
    id: "points_10000",
    title: "Millonario",
    description: "10.000 puntos ganados en total",
    emoji: "🤑",
    category: "special",
    condition: (s) => s.totalPointsEarned >= 10000,
    points: 500,
    rarity: "epic",
  },

  // ── Especiales ──────────────────────────────────────────────
  {
    id: "early_bird",
    title: "Madrugador",
    description: "Completa una tarea antes de las 8 de la mañana",
    emoji: "🌅",
    category: "special",
    condition: (s) => s.daysActive >= 1,
    points: 50,
    rarity: "rare",
  },
  {
    id: "consistent_month",
    title: "Constancia",
    description: "Activo 30 días diferentes",
    emoji: "📅",
    category: "special",
    condition: (s) => s.daysActive >= 30,
    points: 200,
    rarity: "rare",
  },
];

export const RARITY_CONFIG = {
  common:    { label: "Común",      color: "bg-gray-100 text-gray-600",     border: "border-gray-300",    glow: "" },
  rare:      { label: "Raro",       color: "bg-blue-100 text-blue-700",     border: "border-blue-300",    glow: "shadow-blue-200" },
  epic:      { label: "Épico",      color: "bg-purple-100 text-purple-700", border: "border-purple-300",  glow: "shadow-purple-200" },
  legendary: { label: "Legendario", color: "bg-yellow-100 text-yellow-700", border: "border-yellow-400",  glow: "shadow-yellow-200" },
};

export const CATEGORY_CONFIG: Record<AchievementCategory, { label: string; emoji: string }> = {
  streak:  { label: "Racha",       emoji: "🔥" },
  tasks:   { label: "Tareas",      emoji: "✅" },
  rewards: { label: "Recompensas", emoji: "🎁" },
  social:  { label: "Social",      emoji: "👨‍👩‍👧" },
  special: { label: "Especiales",  emoji: "⭐" },
};

// Mock: simulate which achievements are unlocked based on mock stats
export const MOCK_USER_STATS: Record<string, UserStats> = {
  u1: { totalTasksCompleted: 87, currentStreak: 7,  bestStreak: 14, totalPoints: 2100, rewardsClaimed: 1, perfectWeeks: 2, totalPointsEarned: 4200, daysActive: 42 },
  u2: { totalTasksCompleted: 34, currentStreak: 7,  bestStreak: 7,  totalPoints: 1250, rewardsClaimed: 2, perfectWeeks: 1, totalPointsEarned: 1850, daysActive: 28 },
  u3: { totalTasksCompleted: 18, currentStreak: 3,  bestStreak: 5,  totalPoints: 840,  rewardsClaimed: 0, perfectWeeks: 0, totalPointsEarned: 840,  daysActive: 15 },
};
