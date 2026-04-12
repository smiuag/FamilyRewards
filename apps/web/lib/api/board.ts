import { createClient } from "@/lib/supabase/client";

export interface BoardMessageRow {
  id: string;
  family_id: string;
  profile_id: string | null;
  type: "message" | "achievement" | "reward" | "announcement" | "points";
  content: string;
  emoji: string | null;
  pinned: boolean;
  created_at: string;
}

export interface BoardMessage {
  id: string;
  familyId: string;
  profileId: string | null;
  type: BoardMessageRow["type"];
  content: string;
  emoji: string | null;
  pinned: boolean;
  createdAt: string;
}

function toMessage(row: BoardMessageRow): BoardMessage {
  return {
    id: row.id,
    familyId: row.family_id,
    profileId: row.profile_id,
    type: row.type,
    content: row.content,
    emoji: row.emoji,
    pinned: row.pinned,
    createdAt: row.created_at,
  };
}

export async function fetchBoardMessages(limit = 50): Promise<BoardMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => toMessage(r as BoardMessageRow));
}

export async function postBoardMessage(params: {
  familyId: string;
  profileId: string;
  content: string;
  type?: BoardMessageRow["type"];
  emoji?: string;
}): Promise<BoardMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_messages")
    .insert({
      family_id: params.familyId,
      profile_id: params.profileId,
      content: params.content,
      type: params.type ?? "message",
      emoji: params.emoji ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toMessage(data as BoardMessageRow);
}

// ── Reactions ───────────────────────────────────────────────

export interface ReactionRow {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  profileId: string;
  emoji: string;
  createdAt: string;
}

function toReaction(row: ReactionRow): Reaction {
  return {
    id: row.id,
    messageId: row.message_id,
    profileId: row.profile_id,
    emoji: row.emoji,
    createdAt: row.created_at,
  };
}

/** Fetch all reactions for a list of message IDs */
export async function fetchReactions(messageIds: string[]): Promise<Reaction[]> {
  if (messageIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_reactions")
    .select("*")
    .in("message_id", messageIds);
  if (error) throw error;
  return (data ?? []).map((r) => toReaction(r as ReactionRow));
}

/** Toggle a reaction: add if not present, remove if already exists. Returns updated reactions for that message. */
export async function toggleReaction(params: {
  messageId: string;
  profileId: string;
  emoji: string;
}): Promise<{ added: boolean }> {
  const supabase = createClient();
  // Check if reaction already exists
  const { data: existing } = await supabase
    .from("board_reactions")
    .select("id")
    .eq("message_id", params.messageId)
    .eq("profile_id", params.profileId)
    .eq("emoji", params.emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("board_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { added: false };
  } else {
    const { error } = await supabase
      .from("board_reactions")
      .insert({
        message_id: params.messageId,
        profile_id: params.profileId,
        emoji: params.emoji,
      });
    if (error) throw error;
    return { added: true };
  }
}

/** Toggle pinned state of a board message (admin only) */
export async function togglePinMessage(messageId: string, pinned: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_messages")
    .update({ pinned })
    .eq("id", messageId);
  if (error) throw error;
}

/** Delete a board message (admin only) */
export async function deleteBoardMessage(messageId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_messages")
    .delete()
    .eq("id", messageId);
  if (error) throw error;
}

/** Fetch board stats for achievements */
export async function fetchBoardStats(profileId: string): Promise<{
  messagesPosted: number;
  reactionsGiven: number;
  reactionsReceived: number;
  maxDistinctEmojisOnOneMessage: number;
}> {
  const supabase = createClient();

  // Messages posted by this user
  const { count: messagesPosted } = await supabase
    .from("board_messages")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);

  // Reactions given by this user
  const { count: reactionsGiven } = await supabase
    .from("board_reactions")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);

  // Reactions received: reactions on messages authored by this user
  const { data: myMsgIds } = await supabase
    .from("board_messages")
    .select("id")
    .eq("profile_id", profileId);
  let reactionsReceived = 0;
  let maxDistinctEmojisOnOneMessage = 0;
  if (myMsgIds && myMsgIds.length > 0) {
    const ids = myMsgIds.map((m) => m.id);
    const { data: rxns } = await supabase
      .from("board_reactions")
      .select("message_id, emoji")
      .in("message_id", ids);
    reactionsReceived = rxns?.length ?? 0;
    // Count distinct emojis per message
    const emojisByMsg: Record<string, Set<string>> = {};
    for (const r of rxns ?? []) {
      if (!emojisByMsg[r.message_id]) emojisByMsg[r.message_id] = new Set();
      emojisByMsg[r.message_id].add(r.emoji);
    }
    for (const s of Object.values(emojisByMsg)) {
      maxDistinctEmojisOnOneMessage = Math.max(maxDistinctEmojisOnOneMessage, s.size);
    }
  }

  return {
    messagesPosted: messagesPosted ?? 0,
    reactionsGiven: reactionsGiven ?? 0,
    reactionsReceived,
    maxDistinctEmojisOnOneMessage,
  };
}

export async function postSystemBoardMessage(params: {
  familyId: string;
  content: string;
  type: BoardMessageRow["type"];
  emoji?: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_messages")
    .insert({
      family_id: params.familyId,
      profile_id: null,
      content: params.content,
      type: params.type,
      emoji: params.emoji ?? null,
    });
  if (error) throw error;
}
