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
