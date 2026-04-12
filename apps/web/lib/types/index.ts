export type Role = "admin" | "member";

export type TaskState = "pending" | "completed" | "failed" | "cancelled";

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
  vacationUntil?: string | null; // "YYYY-MM-DD"
  birthDate?: string | null; // "YYYY-MM-DD"
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
  defaultState?: "pending" | "completed"; // for non-recurring tasks; recurring uses recurringPattern.defaultState
  deadline?: string;      // "YYYY-MM-DD", only for non-recurring tasks
  penaltyPoints?: number; // points deducted if failed; null/undefined = same as points; 0 = no penalty
  isActive: boolean;      // for recurring tasks
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

export interface MysteryPrize {
  name: string;
  emoji: string;
  weight: number; // higher = more likely
}

export interface RevealedPrize {
  name: string;
  emoji: string;
}

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  pointsCost: number;
  emoji: string;
  status: RewardStatus;
  mysteryPrizes?: MysteryPrize[] | null; // non-null = mystery box
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  userId: string;
  requestedAt: string;
  status: ClaimStatus;
  resolvedAt?: string;
  revealedPrize?: RevealedPrize | null; // set when mystery box is claimed
}

export interface TaskTemplate {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  emoji: string;
  createdBy: string;
  createdAt: string;
  items: TaskTemplateItem[];
}

export interface TaskTemplateItem {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  points: number;
  recurringPattern: RecurringPattern;
  penaltyPoints?: number;
}

export interface PointsHistoryEntry {
  id: string;
  userId: string;
  amount: number; // positive or negative
  reason: string;
  source: PointsSource;
  date: string;
}

// ── Pet types ──────────────────────────────────────────────

export type PetSpecies = "fire" | "water" | "plant" | "electric" | "shadow";
export type PetStage = "egg" | "baby" | "juvenile" | "adult";
export type PetMood = "happy" | "neutral" | "sad";
export type AccessorySlot = "head" | "body" | "background";

export interface FamilyPet {
  id: string;
  familyId: string;
  name: string;
  species: PetSpecies | null;
  stage: PetStage;
  carePoints: number;
  primaryColor: string;
  secondaryColor: string;
  eyeStyle: string;
  activeAccessories: Record<AccessorySlot, string | null>;
  hatchedAt: string | null;
  createdAt: string;
}

export interface PetAccessory {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  slot: AccessorySlot;
  emoji: string;
  pointsCost: number;
  svgKey: string;
}

export interface PetInventoryItem {
  id: string;
  familyId: string;
  accessoryId: string;
  purchasedBy: string;
  purchasedAt: string;
}

export interface PetCareLogEntry {
  id: string;
  familyId: string;
  profileId: string;
  amount: number;
  source: string;
  createdAt: string;
}

// ── Poll types ─────────────────────────────────────────────

export type PollType = "standard" | "system";
export type PollVisibility = "public" | "private";
export type PollStatus = "active" | "closed" | "cancelled";

export interface PollOption {
  key: string;
  label: string;
  labelEn: string;
}

export interface FamilyPoll {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  type: PollType;
  systemAction?: string;
  visibility: PollVisibility;
  options: PollOption[];
  createdBy: string;
  status: PollStatus;
  result?: string;
  expiresAt: string;
  closedAt?: string;
  createdAt: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  profileId: string;
  optionKey: string;
  votedAt: string;
}

// ── Transaction types ──────────────────────────────────────

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
