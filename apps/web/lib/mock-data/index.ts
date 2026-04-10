import type {
  Family,
  User,
  Task,
  TaskInstance,
  Reward,
  RewardClaim,
  PointsHistoryEntry,
} from "@/lib/types";

// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    familyId: "f1",
    name: "María",
    avatar: "👩",
    role: "admin",
    pointsBalance: 2100,
    createdAt: "2024-01-01",
  },
  {
    id: "u2",
    familyId: "f1",
    name: "Ana",
    avatar: "👧",
    role: "member",
    pointsBalance: 1250,
    createdAt: "2024-01-01",
  },
  {
    id: "u3",
    familyId: "f1",
    name: "Pablo",
    avatar: "👦",
    role: "member",
    pointsBalance: 840,
    createdAt: "2024-01-01",
  },
];

export const MOCK_FAMILY: Family = {
  id: "f1",
  name: "Familia García",
  members: MOCK_USERS,
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    familyId: "f1",
    title: "Ir al trabajo",
    description: "Jornada laboral completa",
    points: 50,
    assignedTo: ["u1"],
    createdBy: "u1",
    isRecurring: true,
    recurringPattern: {
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
      time: "09:00",
      durationHours: 8,
      defaultState: "completed",
    },
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "t2",
    familyId: "f1",
    title: "Hacer los deberes",
    description: "Completar las tareas escolares del día",
    points: 30,
    assignedTo: ["u2", "u3"],
    createdBy: "u1",
    isRecurring: true,
    recurringPattern: {
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
      time: "17:00",
      durationHours: 2,
      defaultState: "pending",
    },
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "t3",
    familyId: "f1",
    title: "Limpiar la habitación",
    description: "Ordenar y barrer la habitación",
    points: 20,
    assignedTo: ["u2", "u3"],
    createdBy: "u1",
    isRecurring: true,
    recurringPattern: {
      daysOfWeek: ["sat"],
      time: "11:00",
      defaultState: "pending",
    },
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "t4",
    familyId: "f1",
    title: "Comprar el pan",
    description: "Ir a la panadería",
    points: 5,
    assignedTo: ["u1", "u2", "u3"],
    createdBy: "u1",
    isRecurring: true,
    recurringPattern: {
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      defaultState: "pending",
    },
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "t5",
    familyId: "f1",
    title: "Preparar la cena familiar",
    description: "Cocinar para todos",
    points: 15,
    assignedTo: ["u1"],
    createdBy: "u1",
    isRecurring: false,
    isActive: true,
    createdAt: "2024-03-01",
  },
];

// ─── Task Instances (for today and this week) ─────────────────────────────────

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

export const MOCK_TASK_INSTANCES: TaskInstance[] = [
  // Today — María
  {
    id: "ti1",
    taskId: "t1",
    userId: "u1",
    date: today,
    state: "completed",
    pointsAwarded: 50,
  },
  {
    id: "ti2",
    taskId: "t4",
    userId: "u1",
    date: today,
    state: "pending",
    pointsAwarded: 0,
  },
  {
    id: "ti3",
    taskId: "t5",
    userId: "u1",
    date: today,
    state: "pending",
    pointsAwarded: 0,
  },
  // Today — Ana
  {
    id: "ti4",
    taskId: "t2",
    userId: "u2",
    date: today,
    state: "completed",
    pointsAwarded: 30,
  },
  {
    id: "ti5",
    taskId: "t4",
    userId: "u2",
    date: today,
    state: "pending",
    pointsAwarded: 0,
  },
  // Today — Pablo
  {
    id: "ti6",
    taskId: "t2",
    userId: "u3",
    date: today,
    state: "pending",
    pointsAwarded: 0,
  },
  {
    id: "ti7",
    taskId: "t4",
    userId: "u3",
    date: today,
    state: "cancelled",
    pointsAwarded: 0,
  },
  // Yesterday — Ana (completed)
  {
    id: "ti8",
    taskId: "t2",
    userId: "u2",
    date: yesterday,
    state: "completed",
    pointsAwarded: 30,
  },
  {
    id: "ti9",
    taskId: "t4",
    userId: "u2",
    date: yesterday,
    state: "completed",
    pointsAwarded: 5,
  },
];

// ─── Rewards ──────────────────────────────────────────────────────────────────

export const MOCK_REWARDS: Reward[] = [
  {
    id: "r1",
    familyId: "f1",
    title: "Teléfono nuevo",
    description: "El último modelo de smartphone",
    pointsCost: 5000,
    emoji: "📱",
    status: "available",
  },
  {
    id: "r2",
    familyId: "f1",
    title: "Viaje de fin de semana",
    description: "Un fin de semana de escapada en familia",
    pointsCost: 10000,
    emoji: "✈️",
    status: "available",
  },
  {
    id: "r3",
    familyId: "f1",
    title: "Tarde libre de tareas",
    description: "Un día sin deberes ni responsabilidades",
    pointsCost: 200,
    emoji: "🎉",
    status: "available",
  },
  {
    id: "r4",
    familyId: "f1",
    title: "Pizza para cenar",
    description: "Pedimos pizza la noche que elijas",
    pointsCost: 300,
    emoji: "🍕",
    status: "available",
  },
  {
    id: "r5",
    familyId: "f1",
    title: "Noche de juegos",
    description: "Una noche de juegos de mesa en familia",
    pointsCost: 150,
    emoji: "🎮",
    status: "available",
  },
  {
    id: "r6",
    familyId: "f1",
    title: "Bici nueva",
    description: "Una bicicleta de montaña",
    pointsCost: 8000,
    emoji: "🚲",
    status: "available",
  },
];

// ─── Reward Claims ────────────────────────────────────────────────────────────

export const MOCK_CLAIMS: RewardClaim[] = [
  {
    id: "c1",
    rewardId: "r3",
    userId: "u2",
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "pending",
  },
  {
    id: "c2",
    rewardId: "r5",
    userId: "u3",
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
  },
  {
    id: "c3",
    rewardId: "r4",
    userId: "u2",
    requestedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "approved",
    resolvedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

// ─── Points History ───────────────────────────────────────────────────────────

export const MOCK_POINTS_HISTORY: PointsHistoryEntry[] = [
  {
    id: "ph1",
    userId: "u2",
    amount: 30,
    reason: "Hacer los deberes",
    source: "task",
    date: today,
  },
  {
    id: "ph2",
    userId: "u2",
    amount: 30,
    reason: "Hacer los deberes",
    source: "task",
    date: yesterday,
  },
  {
    id: "ph3",
    userId: "u2",
    amount: 5,
    reason: "Comprar el pan",
    source: "task",
    date: yesterday,
  },
  {
    id: "ph4",
    userId: "u2",
    amount: -300,
    reason: "Pizza para cenar (canje)",
    source: "reward",
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "ph5",
    userId: "u2",
    amount: 50,
    reason: "Bonus por semana perfecta",
    source: "manual",
    date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "ph6",
    userId: "u3",
    amount: 30,
    reason: "Hacer los deberes",
    source: "task",
    date: yesterday,
  },
  {
    id: "ph7",
    userId: "u1",
    amount: 50,
    reason: "Ir al trabajo",
    source: "task",
    date: today,
  },
];
