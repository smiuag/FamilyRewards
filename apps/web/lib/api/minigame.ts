import { createClient } from "@/lib/supabase/client";
import { recordTransaction } from "@/lib/api/transactions";
import type { MinigameConfig, MinigameResult, MinigameDifficulty } from "@/lib/types";

// ── Supabase row shape ────────────────────────────────────

interface SupabaseMinigameResult {
  id: string;
  profile_id: string;
  family_id: string;
  difficulty: MinigameDifficulty;
  pairs_found: number;
  total_pairs: number;
  moves: number;
  time_seconds: number;
  points_earned: number;
  perfect: boolean;
  played_at: string;
}

function toResult(r: SupabaseMinigameResult): MinigameResult {
  return {
    id: r.id,
    profileId: r.profile_id,
    familyId: r.family_id,
    difficulty: r.difficulty,
    pairsFound: r.pairs_found,
    totalPairs: r.total_pairs,
    moves: r.moves,
    timeSeconds: r.time_seconds,
    pointsEarned: r.points_earned,
    perfect: r.perfect,
    playedAt: r.played_at,
  };
}

// ── Config ────────────────────────────────────────────────

export async function fetchMinigameConfig(familyId: string): Promise<MinigameConfig> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("families")
    .select("minigame_enabled, minigame_max_daily, minigame_points_base")
    .eq("id", familyId)
    .single();
  if (error) throw error;
  return {
    enabled: data.minigame_enabled,
    maxDaily: data.minigame_max_daily,
    pointsBase: data.minigame_points_base,
  };
}

export async function updateMinigameConfig(
  familyId: string,
  config: MinigameConfig,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("families")
    .update({
      minigame_enabled: config.enabled,
      minigame_max_daily: config.maxDaily,
      minigame_points_base: config.pointsBase,
    })
    .eq("id", familyId);
  if (error) throw error;
}

// ── Daily count ───────────────────────────────────────────

export async function fetchTodayGamesCount(profileId: string): Promise<number> {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("minigame_results")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .gte("played_at", todayStart.toISOString());
  if (error) throw error;
  return count ?? 0;
}

// ── Save result ───────────────────────────────────────────

export async function saveMinigameResult(data: {
  profileId: string;
  familyId: string;
  difficulty: MinigameDifficulty;
  pairsFound: number;
  totalPairs: number;
  moves: number;
  timeSeconds: number;
  pointsEarned: number;
  perfect: boolean;
}): Promise<MinigameResult> {
  const supabase = createClient();

  // 1. Insert result
  const { data: row, error } = await supabase
    .from("minigame_results")
    .insert({
      profile_id: data.profileId,
      family_id: data.familyId,
      difficulty: data.difficulty,
      pairs_found: data.pairsFound,
      total_pairs: data.totalPairs,
      moves: data.moves,
      time_seconds: data.timeSeconds,
      points_earned: data.pointsEarned,
      perfect: data.perfect,
    })
    .select()
    .single();
  if (error) throw error;

  // 2. Award points
  if (data.pointsEarned > 0) {
    // Read current balance
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("points_balance")
      .eq("id", data.profileId)
      .single();
    if (pErr) throw pErr;

    const newBalance = (profile.points_balance ?? 0) + data.pointsEarned;

    await supabase
      .from("profiles")
      .update({ points_balance: newBalance })
      .eq("id", data.profileId);

    await recordTransaction({
      profileId: data.profileId,
      amount: data.pointsEarned,
      type: "minigame",
      description: `Pet Match (${data.difficulty})`,
      emoji: "🧩",
      balanceAfter: newBalance,
    }).catch(() => {}); // fire-and-forget
  }

  return toResult(row as SupabaseMinigameResult);
}

// ── Player results ────────────────────────────────────────

export async function fetchPlayerResults(
  profileId: string,
  limit = 20,
): Promise<MinigameResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("minigame_results")
    .select("*")
    .eq("profile_id", profileId)
    .order("played_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => toResult(r as SupabaseMinigameResult));
}

// ── Weekly ranking ────────────────────────────────────────

export interface RankingEntry {
  profileId: string;
  name: string;
  avatar: string;
  points: number;
}

export async function fetchWeeklyRanking(familyId: string): Promise<RankingEntry[]> {
  const supabase = createClient();

  // Get Monday 00:00 of current week
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Fetch this week's results for the family
  const { data: results, error } = await supabase
    .from("minigame_results")
    .select("profile_id, points_earned")
    .eq("family_id", familyId)
    .gte("played_at", monday.toISOString());
  if (error) throw error;

  if (!results || results.length === 0) return [];

  // Aggregate points by profile
  const totals = new Map<string, number>();
  for (const r of results) {
    totals.set(r.profile_id, (totals.get(r.profile_id) ?? 0) + r.points_earned);
  }

  // Fetch profile names/avatars
  const profileIds = [...totals.keys()];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, name, avatar")
    .in("id", profileIds);
  if (pErr) throw pErr;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return [...totals.entries()]
    .map(([profileId, points]) => {
      const p = profileMap.get(profileId);
      return {
        profileId,
        name: p?.name ?? "?",
        avatar: p?.avatar ?? "😊",
        points,
      };
    })
    .sort((a, b) => b.points - a.points);
}
