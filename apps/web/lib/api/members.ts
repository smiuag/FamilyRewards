import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export interface SupabaseProfile {
  id: string;
  auth_user_id: string | null;
  family_id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  points_balance: number;
  created_at: string;
}

export function toUser(p: SupabaseProfile): User {
  return {
    id: p.id,
    familyId: p.family_id,
    name: p.name,
    avatar: p.avatar,
    role: p.role,
    pointsBalance: p.points_balance,
    createdAt: p.created_at,
  };
}

export async function fetchFamilyProfiles(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toUser);
}

export async function addManagedProfile(
  familyId: string,
  data: { name: string; avatar: string; role: "admin" | "member" }
): Promise<User> {
  const supabase = createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({ family_id: familyId, ...data })
    .select()
    .single();
  if (error) throw error;
  return toUser(profile as SupabaseProfile);
}

export async function updateProfile(
  id: string,
  data: Partial<{ name: string; avatar: string; role: "admin" | "member" }>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", id);
  if (error) throw error;
}

export async function adjustProfilePoints(
  profileId: string,
  currentBalance: number,
  amount: number,
  description: string
): Promise<number> {
  const supabase = createClient();
  const newBalance = Math.max(0, currentBalance + amount);

  const { error: txError } = await supabase
    .from("points_transactions")
    .insert({
      profile_id: profileId,
      amount,
      type: "adjustment",
      description: description || "Ajuste manual",
      emoji: amount > 0 ? "⭐" : "➖",
      balance_after: newBalance,
    });
  if (txError) throw txError;

  const { error: balanceError } = await supabase
    .from("profiles")
    .update({ points_balance: newBalance })
    .eq("id", profileId);
  if (balanceError) throw balanceError;

  return newBalance;
}

export async function createInvitation(
  familyId: string,
  invitedByProfileId: string,
  email: string,
  role: "admin" | "member"
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .insert({
      family_id: familyId,
      email,
      role,
      invited_by: invitedByProfileId,
    })
    .select("token")
    .single();
  if (error) throw error;
  return (data as { token: string }).token;
}

export async function getInvitationInfo(
  token: string
): Promise<{ familyName: string; email: string; role: "admin" | "member" } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .select("email, role, family_id, accepted_at, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  if (data.accepted_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  const { data: familyData } = await supabase
    .from("families")
    .select("name")
    .eq("id", data.family_id)
    .single();

  return {
    familyName: familyData?.name ?? "Mi familia",
    email: data.email,
    role: data.role as "admin" | "member",
  };
}
