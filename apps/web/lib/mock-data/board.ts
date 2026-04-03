export type MessageType = "message" | "achievement" | "reward" | "announcement";

export interface BoardMessage {
  id: string;
  userId: string;
  type: MessageType;
  content: string;
  emoji?: string;
  likes: string[]; // user IDs who liked
  createdAt: string;
  pinned?: boolean;
}

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const MOCK_BOARD_MESSAGES: BoardMessage[] = [
  {
    id: "bm1",
    userId: "u1",
    type: "announcement",
    content: "¡Este fin de semana si todos completan sus tareas, pedimos pizza el domingo! 🍕 A por ello familia!",
    emoji: "📢",
    likes: ["u2", "u3"],
    createdAt: h(2),
    pinned: true,
  },
  {
    id: "bm2",
    userId: "system",
    type: "achievement",
    content: "Ana ha conseguido el logro **⚡ Una semana completa** — 7 días seguidos completando tareas. ¡Enhorabuena!",
    emoji: "🏅",
    likes: ["u1", "u3"],
    createdAt: h(5),
  },
  {
    id: "bm3",
    userId: "u2",
    type: "message",
    content: "¡Ya he terminado los deberes de mates! Fue difícil pero lo conseguí 💪",
    likes: ["u1"],
    createdAt: h(6),
  },
  {
    id: "bm4",
    userId: "system",
    type: "reward",
    content: "Pablo ha solicitado canjear **🎮 Noche de juegos** por 150 puntos. ¡Pendiente de aprobación!",
    emoji: "🎁",
    likes: [],
    createdAt: h(22),
  },
  {
    id: "bm5",
    userId: "u1",
    type: "message",
    content: "¡Buenas noticias! A partir de la semana que viene, hacer la cama valdrá 5 puntos extra los lunes 🎉",
    likes: ["u2"],
    createdAt: h(28),
  },
  {
    id: "bm6",
    userId: "u3",
    type: "message",
    content: "Mamá, ¿puedo cambiar los deberes del miércoles por limpiar el baño? Pide más puntos 😄",
    likes: ["u1"],
    createdAt: h(36),
  },
  {
    id: "bm7",
    userId: "system",
    type: "achievement",
    content: "Pablo ha conseguido el logro **🔥 Primeros pasos** — 3 días seguidos sin fallar. ¡Sigue así!",
    emoji: "🏅",
    likes: ["u1", "u2"],
    createdAt: h(48),
  },
];
