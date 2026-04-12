import { createClient } from "@/lib/supabase/client";
import type {
  FamilyPoll,
  PollVote,
  PollOption,
  PollType,
  PollVisibility,
  PollStatus,
} from "@/lib/types";

// ── Supabase row interfaces ────────────────────────────────

interface SupabasePoll {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  type: PollType;
  system_action: string | null;
  visibility: PollVisibility;
  options: PollOption[];
  created_by: string;
  status: PollStatus;
  result: string | null;
  expires_at: string;
  closed_at: string | null;
  created_at: string;
}

interface SupabaseVote {
  id: string;
  poll_id: string;
  profile_id: string;
  option_key: string;
  voted_at: string;
}

// ── Mappers ────────────────────────────────────────────────

function toPoll(r: SupabasePoll): FamilyPoll {
  return {
    id: r.id,
    familyId: r.family_id,
    title: r.title,
    description: r.description ?? undefined,
    type: r.type,
    systemAction: r.system_action ?? undefined,
    visibility: r.visibility,
    options: r.options,
    createdBy: r.created_by,
    status: r.status,
    result: r.result ?? undefined,
    expiresAt: r.expires_at,
    closedAt: r.closed_at ?? undefined,
    createdAt: r.created_at,
  };
}

function toVote(r: SupabaseVote): PollVote {
  return {
    id: r.id,
    pollId: r.poll_id,
    profileId: r.profile_id,
    optionKey: r.option_key,
    votedAt: r.voted_at,
  };
}

// ── Polls CRUD ─────────────────────────────────────────────

export async function fetchFamilyPolls(): Promise<FamilyPoll[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_polls")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toPoll(r as SupabasePoll));
}

export async function fetchActivePoll(): Promise<FamilyPoll | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_polls")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toPoll(data as SupabasePoll) : null;
}

export async function createPoll(data: {
  familyId: string;
  title: string;
  description?: string;
  type: PollType;
  systemAction?: string;
  visibility: PollVisibility;
  options: PollOption[];
  createdBy: string;
  expiresAt: string;
}): Promise<FamilyPoll> {
  const supabase = createClient();
  const { data: poll, error } = await supabase
    .from("family_polls")
    .insert({
      family_id: data.familyId,
      title: data.title,
      description: data.description || null,
      type: data.type,
      system_action: data.systemAction || null,
      visibility: data.visibility,
      options: data.options,
      created_by: data.createdBy,
      expires_at: data.expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return toPoll(poll as SupabasePoll);
}

export async function closePoll(
  pollId: string,
  votes: PollVote[],
  options: PollOption[]
): Promise<string | null> {
  const counts = getVoteCounts(votes, options);

  // Find winner — null if tie or no votes
  let maxKey: string | null = null;
  let maxCount = 0;
  let isTie = false;
  for (const [key, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
      isTie = false;
    } else if (count === maxCount && count > 0) {
      isTie = true;
    }
  }

  // Tie or no votes = no winner
  if (isTie || maxCount === 0) maxKey = null;

  const supabase = createClient();
  const { error } = await supabase
    .from("family_polls")
    .update({
      status: "closed",
      result: maxKey,
      closed_at: new Date().toISOString(),
    })
    .eq("id", pollId);
  if (error) throw error;

  return maxKey;
}

export async function cancelPoll(pollId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("family_polls")
    .update({
      status: "cancelled",
      closed_at: new Date().toISOString(),
    })
    .eq("id", pollId);
  if (error) throw error;
}

export async function extendPoll(pollId: string, extraMs: number): Promise<string> {
  const supabase = createClient();
  // Fetch current expiry
  const { data: poll, error: fetchErr } = await supabase
    .from("family_polls")
    .select("expires_at")
    .eq("id", pollId)
    .single();
  if (fetchErr) throw fetchErr;

  const current = new Date(poll.expires_at);
  const now = new Date();
  const base = current > now ? current : now;
  const newExpiry = new Date(base.getTime() + extraMs).toISOString();

  const { error } = await supabase
    .from("family_polls")
    .update({ expires_at: newExpiry })
    .eq("id", pollId);
  if (error) throw error;
  return newExpiry;
}

// ── Votes ──────────────────────────────────────────────────

export async function fetchPollVotes(pollId: string): Promise<PollVote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_poll_votes")
    .select("*")
    .eq("poll_id", pollId)
    .order("voted_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toVote(r as SupabaseVote));
}

export async function castVote(
  pollId: string,
  profileId: string,
  optionKey: string
): Promise<PollVote> {
  const supabase = createClient();

  // Check if already voted
  const { data: existing } = await supabase
    .from("family_poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing) {
    // Update existing vote
    const { data: updated, error } = await supabase
      .from("family_poll_votes")
      .update({ option_key: optionKey, voted_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return toVote(updated as SupabaseVote);
  }

  // New vote
  const { data: vote, error } = await supabase
    .from("family_poll_votes")
    .insert({
      poll_id: pollId,
      profile_id: profileId,
      option_key: optionKey,
    })
    .select()
    .single();
  if (error) throw error;
  return toVote(vote as SupabaseVote);
}

// ── Helpers ────────────────────────────────────────────────

export function getVoteCounts(
  votes: PollVote[],
  options: PollOption[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const opt of options) counts[opt.key] = 0;
  for (const vote of votes) {
    if (counts[vote.optionKey] !== undefined) counts[vote.optionKey]++;
  }
  return counts;
}

export function applySystemAction(action: string): void {
  if (action === "enable_pets") {
    import("@/lib/store/useAppStore").then(({ useAppStore }) => {
      useAppStore.getState().unlockFeature("pets");
    });
  }
}
