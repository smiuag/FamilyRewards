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
    authUserId: p.auth_user_id,
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

export async function deleteProfile(id: string): Promise<{ authUserId: string | null }> {
  const supabase = createClient();
  // Obtener auth_user_id antes de borrar
  const { data: profile } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", id)
    .single();
  const authUserId = profile?.auth_user_id ?? null;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { authUserId };
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

export async function updateFamilyName(
  familyId: string,
  name: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("families")
    .update({ name })
    .eq("id", familyId);
  if (error) throw error;
}

export async function fetchFamilyName(familyId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("families")
    .select("name")
    .eq("id", familyId)
    .single();
  return data?.name ?? "Mi familia";
}

export interface FamilySettings {
  name: string;
  onboardingCompleted: boolean;
  setupVisited: { members: boolean; catalogTasks: boolean; catalogRewards: boolean };
}

export async function fetchFamilySettings(familyId: string): Promise<FamilySettings> {
  const supabase = createClient();
  const { data } = await supabase
    .from("families")
    .select("name, onboarding_completed, setup_visited_members, setup_visited_tasks, setup_visited_rewards")
    .eq("id", familyId)
    .single();
  return {
    name: data?.name ?? "Mi familia",
    onboardingCompleted: data?.onboarding_completed ?? false,
    setupVisited: {
      members: data?.setup_visited_members ?? false,
      catalogTasks: data?.setup_visited_tasks ?? false,
      catalogRewards: data?.setup_visited_rewards ?? false,
    },
  };
}

export async function updateFamilyOnboarding(
  familyId: string,
  completed: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("families")
    .update({ onboarding_completed: completed })
    .eq("id", familyId);
  if (error) throw error;
}

export async function updateFamilySetupVisited(
  familyId: string,
  section: "members" | "catalogTasks" | "catalogRewards"
): Promise<void> {
  const supabase = createClient();
  const col =
    section === "members" ? "setup_visited_members" :
    section === "catalogTasks" ? "setup_visited_tasks" :
    "setup_visited_rewards";
  const { error } = await supabase
    .from("families")
    .update({ [col]: true })
    .eq("id", familyId);
  if (error) throw error;
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
