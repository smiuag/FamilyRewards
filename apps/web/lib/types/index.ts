export type Role = "admin" | "member";

export type TaskState = "pending" | "completed" | "not_completed" | "omitted";

export type RewardStatus = "available" | "disabled";

export type ClaimStatus = "pending" | "approved" | "rejected";

export type PointsSource = "task" | "reward" | "manual";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface User {
  id: string;
  familyId: string;
  name: string;
  avatar: string; // emoji or URL
  role: Role;
  pointsBalance: number;
  createdAt: string;
  authUserId?: string | null;
}

export interface Family {
  id: string;
  name: string;
  members: User[];
}

export interface RecurringPattern {
  daysOfWeek: DayOfWeek[];
  time?: string; // "HH:mm"
  durationHours?: number;
  defaultState: "completed" | "pending";
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  points: number;
  assignedTo: string[]; // user IDs
  createdBy: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  isActive: boolean; // for recurring tasks
  createdAt: string;
}

export interface TaskInstance {
  id: string;
  taskId: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  state: TaskState;
  pointsAwarded: number;
}

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  pointsCost: number;
  emoji: string;
  status: RewardStatus;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  userId: string;
  requestedAt: string;
  status: ClaimStatus;
  resolvedAt?: string;
}

export interface PointsHistoryEntry {
  id: string;
  userId: string;
  amount: number; // positive or negative
  reason: string;
  source: PointsSource;
  date: string;
}

export type TransactionType = "task" | "reward" | "adjustment" | "streak";

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number; // positive or negative
  type: TransactionType;
  description: string;
  emoji: string;
  createdAt: string; // ISO datetime
  balanceAfter: number;
}
