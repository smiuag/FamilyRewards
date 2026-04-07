import { createClient } from "@/lib/supabase/client";
import type { PointsTransaction, TransactionType } from "@/lib/types";

interface SupabaseTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  emoji: string;
  balance_after: number;
  created_at: string;
}

function toTransaction(t: SupabaseTransaction): PointsTransaction {
  return {
    id: t.id,
    userId: t.profile_id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    emoji: t.emoji,
    balanceAfter: t.balance_after,
    createdAt: t.created_at,
  };
}

export async function fetchUserTransactions(profileId: string): Promise<PointsTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("points_transactions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((t) => toTransaction(t as SupabaseTransaction));
}

export async function fetchFamilyTransactions(): Promise<PointsTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("points_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((t) => toTransaction(t as SupabaseTransaction));
}

export async function recordTransaction(data: {
  profileId: string;
  amount: number;
  type: TransactionType;
  description: string;
  emoji: string;
  balanceAfter: number;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("points_transactions").insert({
    profile_id: data.profileId,
    amount: data.amount,
    type: data.type,
    description: data.description,
    emoji: data.emoji,
    balance_after: data.balanceAfter,
  });
  if (error) throw error;
}
