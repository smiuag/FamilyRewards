import { createClient } from "@/lib/supabase/client";
import { recordTransaction } from "@/lib/api/transactions";
import type { Reward, RewardClaim, ClaimStatus, MysteryPrize, RevealedPrize } from "@/lib/types";

// ── Mappers ──────────────────────────────────────────────────

interface SupabaseReward {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  emoji: string;
  points_cost: number;
  status: "available" | "disabled";
  mystery_prizes: MysteryPrize[] | null;
  created_at: string;
}

interface SupabaseClaim {
  id: string;
  reward_id: string;
  profile_id: string;
  requested_at: string;
  status: ClaimStatus;
  resolved_at: string | null;
  revealed_prize: RevealedPrize | null;
}

function toReward(r: SupabaseReward): Reward {
  return {
    id: r.id,
    familyId: r.family_id,
    title: r.title,
    description: r.description ?? undefined,
    emoji: r.emoji,
    pointsCost: r.points_cost,
    status: r.status,
    mysteryPrizes: r.mystery_prizes ?? undefined,
  };
}

function toClaim(c: SupabaseClaim): RewardClaim {
  return {
    id: c.id,
    rewardId: c.reward_id,
    userId: c.profile_id,
    requestedAt: c.requested_at,
    status: c.status,
    resolvedAt: c.resolved_at ?? undefined,
    revealedPrize: c.revealed_prize ?? undefined,
  };
}

// ── Mystery box helpers ─────────────────────────────────────

export function pickMysteryPrize(prizes: MysteryPrize[]): RevealedPrize {
  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const prize of prizes) {
    roll -= prize.weight;
    if (roll <= 0) return { name: prize.name, emoji: prize.emoji };
  }
  // Fallback to last prize
  const last = prizes[prizes.length - 1];
  return { name: last.name, emoji: last.emoji };
}

// ── Rewards CRUD ──────────────────────────────────────────────

export async function fetchFamilyRewards(): Promise<Reward[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toReward(r as SupabaseReward));
}

export async function createReward(
  familyId: string,
  data: { title: string; description?: string; emoji: string; pointsCost: number; status: "available" | "disabled"; mysteryPrizes?: MysteryPrize[] | null }
): Promise<Reward> {
  const supabase = createClient();
  const { data: reward, error } = await supabase
    .from("rewards")
    .insert({
      family_id: familyId,
      title: data.title,
      description: data.description || null,
      emoji: data.emoji,
      points_cost: data.pointsCost,
      status: data.status,
      mystery_prizes: data.mysteryPrizes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toReward(reward as SupabaseReward);
}

export async function updateReward(
  id: string,
  data: { title?: string; description?: string; emoji?: string; pointsCost?: number; status?: "available" | "disabled"; mysteryPrizes?: MysteryPrize[] | null }
): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.emoji !== undefined) patch.emoji = data.emoji;
  if (data.pointsCost !== undefined) patch.points_cost = data.pointsCost;
  if (data.status !== undefined) patch.status = data.status;
  if (data.mysteryPrizes !== undefined) patch.mystery_prizes = data.mysteryPrizes;
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase.from("rewards").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteReward(id: string): Promise<void> {
  const supabase = createClient();
  // Claims are kept for history; only the reward definition is removed
  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) throw error;
}

// ── Claims ─────────────────────────────────────────────────────

export async function fetchFamilyClaims(): Promise<RewardClaim[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reward_claims")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => toClaim(c as SupabaseClaim));
}

export async function createClaim(
  rewardId: string,
  profileId: string,
  status: ClaimStatus,
  revealedPrize?: RevealedPrize | null
): Promise<RewardClaim> {
  const supabase = createClient();
  const insert: Record<string, unknown> = {
    reward_id: rewardId,
    profile_id: profileId,
    status,
  };
  if (revealedPrize) {
    insert.revealed_prize = revealedPrize;
    insert.resolved_at = new Date().toISOString();
  }
  const { data: claim, error } = await supabase
    .from("reward_claims")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return toClaim(claim as SupabaseClaim);
}

export async function approveClaim(
  claimId: string,
  profileId: string,
  pointsCost: number,
  currentBalance: number,
  rewardTitle?: string,
  rewardEmoji?: string
): Promise<void> {
  const supabase = createClient();
  const newBalance = Math.max(0, currentBalance - pointsCost);

  const { error: claimError } = await supabase
    .from("reward_claims")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", claimId);
  if (claimError) throw claimError;

  const { error: balanceError } = await supabase
    .from("profiles")
    .update({ points_balance: newBalance })
    .eq("id", profileId);
  if (balanceError) throw balanceError;

  await recordTransaction({
    profileId,
    amount: -pointsCost,
    type: "reward",
    description: `Recompensa canjeada: ${rewardTitle ?? "Recompensa"}`,
    emoji: rewardEmoji ?? "🎁",
    balanceAfter: newBalance,
  }).catch(() => {});
}

export async function rejectClaim(claimId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reward_claims")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw error;
}
