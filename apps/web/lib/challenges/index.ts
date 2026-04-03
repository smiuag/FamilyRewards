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

const today = new Date();
const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 86400000).toISOString().split("T")[0];
const subDays = (d: Date, n: number) =>
  new Date(d.getTime() - n * 86400000).toISOString().split("T")[0];
const todayStr = today.toISOString().split("T")[0];

export const MOCK_CHALLENGES: FamilyChallenge[] = [
  {
    id: "ch1",
    title: "Semana productiva",
    description:
      "Entre todos acumulamos 500 puntos esta semana. Si lo conseguimos, ¡pizza el domingo!",
    emoji: "🚀",
    goalType: "collective_points",
    goalTarget: 500,
    currentProgress: 320,
    contributions: [
      { userId: "u1", amount: 150 },
      { userId: "u2", amount: 105 },
      { userId: "u3", amount: 65 },
    ],
    rewardDescription: "Pizza para cenar el domingo",
    rewardEmoji: "🍕",
    rewardPoints: 50,
    startDate: subDays(today, 4),
    endDate: addDays(today, 3),
    status: "active",
    createdBy: "u1",
  },
  {
    id: "ch2",
    title: "100 tareas familiares",
    description:
      "Completar 100 tareas entre todos este mes. La recompensa: excursión de un día.",
    emoji: "🏆",
    goalType: "completion_count",
    goalTarget: 100,
    currentProgress: 67,
    contributions: [
      { userId: "u1", amount: 30 },
      { userId: "u2", amount: 22 },
      { userId: "u3", amount: 15 },
    ],
    rewardDescription: "Excursión de un día a un lugar especial",
    rewardEmoji: "🚗",
    rewardPoints: 200,
    startDate: new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "active",
    createdBy: "u1",
  },
  {
    id: "ch3",
    title: "Fin de semana sin pantallas",
    description:
      "Todos completamos la tarea 'Sin pantallas 1 hora' cada día del fin de semana.",
    emoji: "📵",
    goalType: "completion_count",
    goalTarget: 6,
    currentProgress: 6,
    contributions: [
      { userId: "u1", amount: 2 },
      { userId: "u2", amount: 2 },
      { userId: "u3", amount: 2 },
    ],
    rewardDescription: "Noche de juegos de mesa en familia",
    rewardEmoji: "🎲",
    rewardPoints: 75,
    startDate: subDays(today, 9),
    endDate: subDays(today, 2),
    status: "completed",
    createdBy: "u1",
  },
];
