export interface PointMultiplier {
  id: string;
  name: string;
  description: string;
  multiplier: number; // e.g. 2 = 2x points
  emoji: string;
  taskIds: string[] | "all"; // which tasks are affected
  userIds: string[] | "all"; // who gets the multiplier
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
}

const today = new Date();
const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 86400000).toISOString().split("T")[0];
const subDays = (d: Date, n: number) =>
  new Date(d.getTime() - n * 86400000).toISOString().split("T")[0];

export const MOCK_MULTIPLIERS: PointMultiplier[] = [
  {
    id: "mp1",
    name: "Fin de semana productivo",
    description: "El doble de puntos por tareas completadas este fin de semana",
    multiplier: 2,
    emoji: "⚡",
    taskIds: "all",
    userIds: "all",
    startDate: subDays(today, 1),
    endDate: addDays(today, 1),
    isActive: true,
    createdBy: "u1",
  },
  {
    id: "mp2",
    name: "Bonus deberes",
    description: "Puntos extra por hacer los deberes esta semana",
    multiplier: 3,
    emoji: "📚",
    taskIds: ["t2"],
    userIds: ["u2", "u3"],
    startDate: subDays(today, 2),
    endDate: addDays(today, 5),
    isActive: true,
    createdBy: "u1",
  },
  {
    id: "mp3",
    name: "Semana de exámenes",
    description: "Semana de exámenes terminada — puntos triple para los niños",
    multiplier: 3,
    emoji: "🎓",
    taskIds: "all",
    userIds: ["u2", "u3"],
    startDate: subDays(today, 20),
    endDate: subDays(today, 14),
    isActive: false,
    createdBy: "u1",
  },
];

/** Returns all currently active multipliers for a given user and task */
export function getActiveMultiplier(
  userId: string,
  taskId: string,
  multipliers: PointMultiplier[]
): number {
  const todayStr = new Date().toISOString().split("T")[0];
  const active = multipliers.filter(
    (m) =>
      m.isActive &&
      m.startDate <= todayStr &&
      m.endDate >= todayStr &&
      (m.userIds === "all" || m.userIds.includes(userId)) &&
      (m.taskIds === "all" || m.taskIds.includes(taskId))
  );
  if (active.length === 0) return 1;
  // Use the highest multiplier if multiple apply
  return Math.max(...active.map((m) => m.multiplier));
}
