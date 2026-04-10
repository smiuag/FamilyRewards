import type { Task, TaskInstance, User } from "@/lib/types";

export interface DailyReport {
  date: string;
  completed: number;
  pending: number;
  failed: number;
  cancelled: number;
  points: number;
}

export interface MemberReport {
  user: User;
  totalCompleted: number;
  totalFailed: number;
  totalPoints: number;
  completionRate: number; // 0–100
  dailyBreakdown: DailyReport[];
  topTask: string | null;
}

export interface FamilyReport {
  period: "week" | "month";
  startDate: string;
  endDate: string;
  totalCompleted: number;
  totalPoints: number;
  completionRate: number;
  memberReports: MemberReport[];
  bestMemberId: string | null;
  bestStreakMemberId: string | null;
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function buildMemberReport(
  user: User,
  instances: TaskInstance[],
  startDate: string,
  endDate: string,
  tasks: Task[] = []
): MemberReport {
  const userInstances = instances.filter(
    (ti) => ti.userId === user.id && ti.date >= startDate && ti.date <= endDate
  );

  const completed = userInstances.filter((ti) => ti.state === "completed");
  const failed = userInstances.filter((ti) => ti.state === "failed");
  const totalPoints = userInstances.reduce((s, ti) => s + ti.pointsAwarded, 0);
  const completionRate =
    userInstances.length > 0
      ? Math.round((completed.length / userInstances.length) * 100)
      : 0;

  // Find top task by completion count
  const taskCounts: Record<string, number> = {};
  completed.forEach((ti) => {
    taskCounts[ti.taskId] = (taskCounts[ti.taskId] ?? 0) + 1;
  });
  const topTaskId = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTask = topTaskId
    ? (tasks.find((t) => t.id === topTaskId)?.title ?? null)
    : null;

  const dates = getDatesInRange(startDate, endDate);
  const dailyBreakdown: DailyReport[] = dates.map((date) => {
    const dayInstances = userInstances.filter((ti) => ti.date === date);
    return {
      date,
      completed: dayInstances.filter((ti) => ti.state === "completed").length,
      pending: dayInstances.filter((ti) => ti.state === "pending").length,
      failed: dayInstances.filter((ti) => ti.state === "failed").length,
      cancelled: dayInstances.filter((ti) => ti.state === "cancelled").length,
      points: dayInstances
        .filter((ti) => ti.state === "completed")
        .reduce((s, ti) => s + ti.pointsAwarded, 0),
    };
  });

  return {
    user,
    totalCompleted: completed.length,
    totalFailed: failed.length,
    totalPoints,
    completionRate,
    dailyBreakdown,
    topTask,
  };
}

export function buildFamilyReport(
  users: User[],
  instances: TaskInstance[],
  period: "week" | "month",
  tasks: Task[] = []
): FamilyReport {
  const today = new Date();
  let startDate: string;
  let endDate: string;

  if (period === "week") {
    const day = today.getDay(); // 0=Sun, 1=Mon...
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    startDate = monday.toISOString().split("T")[0];
    endDate = today.toISOString().split("T")[0];
  } else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    endDate = today.toISOString().split("T")[0];
  }

  const memberReports = users.map((u) =>
    buildMemberReport(u, instances, startDate, endDate, tasks)
  );

  const totalCompleted = memberReports.reduce((s, r) => s + r.totalCompleted, 0);
  const totalPoints = memberReports.reduce((s, r) => s + r.totalPoints, 0);
  const allInstances = instances.filter(
    (ti) => ti.date >= startDate && ti.date <= endDate
  );
  const completionRate =
    allInstances.length > 0
      ? Math.round(
          (allInstances.filter((ti) => ti.state === "completed").length /
            allInstances.length) *
            100
        )
      : 0;

  const bestMember = memberReports.reduce<MemberReport | null>(
    (best, r) => (!best || r.totalPoints > best.totalPoints ? r : best),
    null
  );

  return {
    period,
    startDate,
    endDate,
    totalCompleted,
    totalPoints,
    completionRate,
    memberReports,
    bestMemberId: bestMember?.user.id ?? null,
    bestStreakMemberId: null, // computed from achievements in real app
  };
}
