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
