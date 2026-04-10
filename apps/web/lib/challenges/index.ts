export type ChallengeGoalType = "collective_points" | "completion_count" | "streak_all";
export type ChallengeStatus = "active" | "completed" | "failed" | "upcoming";

export interface ChallengeContribution {
  userId: string;
  amount: number; // points or count contributed
}

export interface FamilyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  goalType: ChallengeGoalType;
  goalTarget: number;
  currentProgress: number;
  contributions: ChallengeContribution[];
  rewardDescription: string;
  rewardEmoji: string;
  rewardPoints: number; // bonus points each member gets on completion
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  createdBy: string;
}

