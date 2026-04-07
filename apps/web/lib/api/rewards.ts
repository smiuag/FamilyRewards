import { createClient } from "@/lib/supabase/client";
import type { Reward, RewardClaim, ClaimStatus } from "@/lib/types";

// ── Mappers ──────────────────────────────────────────────────

interface SupabaseReward {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  emoji: string;
  points_cost: number;
  status: "available" | "disabled";
  created_at: string;
}

interface SupabaseClaim {
  id: string;
  reward_id: string;
  profile_id: string;
  requested_at: string;
  status: ClaimStatus;
  resolved_at: string | null;
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
  };
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
  data: { title: string; description?: string; emoji: string; pointsCost: number; status: "available" | "disabled" }
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
    })
    .select()
    .single();
  if (error) throw error;
  return toReward(reward as SupabaseReward);
}

export async function updateReward(
  id: string,
  data: { title?: string; description?: string; emoji?: string; pointsCost?: number; status?: "available" | "disabled" }
): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.emoji !== undefined) patch.emoji = data.emoji;
  if (data.pointsCost !== undefined) patch.points_cost = data.pointsCost;
  if (data.status !== undefined) patch.status = data.status;
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase.from("rewards").update(patch).eq("id", id);
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
  status: ClaimStatus
): Promise<RewardClaim> {
  const supabase = createClient();
  const { data: claim, error } = await supabase
    .from("reward_claims")
    .insert({ reward_id: rewardId, profile_id: profileId, status })
    .select()
    .single();
  if (error) throw error;
  return toClaim(claim as SupabaseClaim);
}

export async function approveClaim(
  claimId: string,
  profileId: string,
  pointsCost: number,
  currentBalance: number
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
}

export async function rejectClaim(claimId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reward_claims")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) throw error;
}
