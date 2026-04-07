import { createClient } from "@/lib/supabase/client";
import type { Task, TaskInstance, TaskState, DayOfWeek } from "@/lib/types";

// ── Mappers ──────────────────────────────────────────────────

interface SupabaseTask {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  points: number;
  created_by: string | null;
  is_recurring: boolean;
  recurring_pattern: {
    daysOfWeek: DayOfWeek[];
    time?: string;
    durationHours?: number;
    defaultState: "completed" | "pending";
  } | null;
  is_active: boolean;
  created_at: string;
  task_assignments: { profile_id: string }[];
}

interface SupabaseInstance {
  id: string;
  task_id: string;
  profile_id: string;
  date: string;
  state: TaskState;
  points_awarded: number;
}

function toTask(t: SupabaseTask): Task {
  return {
    id: t.id,
    familyId: t.family_id,
    title: t.title,
    description: t.description ?? undefined,
    points: t.points,
    assignedTo: (t.task_assignments ?? []).map((a) => a.profile_id),
    createdBy: t.created_by ?? "",
    isRecurring: t.is_recurring,
    recurringPattern: t.recurring_pattern ?? undefined,
    isActive: t.is_active,
    createdAt: t.created_at,
  };
}

function toInstance(ti: SupabaseInstance): TaskInstance {
  return {
    id: ti.id,
    taskId: ti.task_id,
    userId: ti.profile_id,
    date: ti.date,
    state: ti.state,
    pointsAwarded: ti.points_awarded,
  };
}

// ── Tasks CRUD ────────────────────────────────────────────────

export async function fetchFamilyTasks(): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_assignments(profile_id)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => toTask(t as SupabaseTask));
}

export async function createTask(
  familyId: string,
  createdBy: string,
  data: {
    title: string;
    description?: string;
    points: number;
    assignedTo: string[];
    isRecurring: boolean;
    recurringPattern?: Task["recurringPattern"];
  }
): Promise<Task> {
  const supabase = createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      family_id: familyId,
      title: data.title,
      description: data.description || null,
      points: data.points,
      created_by: createdBy,
      is_recurring: data.isRecurring,
      recurring_pattern: data.recurringPattern ?? null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;

  // Insert assignments
  if (data.assignedTo.length > 0) {
    const { error: assignError } = await supabase
      .from("task_assignments")
      .insert(data.assignedTo.map((profileId) => ({ task_id: task.id, profile_id: profileId })));
    if (assignError) throw assignError;
  }

  // Create today's instances for assigned profiles
  await createTodayInstances(task.id, data.assignedTo, data.points, data.isRecurring, data.recurringPattern);

  return toTask({ ...task, task_assignments: data.assignedTo.map((p) => ({ profile_id: p })) } as SupabaseTask);
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    points?: number;
    assignedTo?: string[];
    isRecurring?: boolean;
    recurringPattern?: Task["recurringPattern"];
    isActive?: boolean;
  }
): Promise<void> {
  const supabase = createClient();

  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.points !== undefined) patch.points = data.points;
  if (data.isRecurring !== undefined) patch.is_recurring = data.isRecurring;
  if (data.recurringPattern !== undefined) patch.recurring_pattern = data.recurringPattern ?? null;
  if (data.isActive !== undefined) patch.is_active = data.isActive;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) throw error;
  }

  if (data.assignedTo !== undefined) {
    // Replace assignments
    await supabase.from("task_assignments").delete().eq("task_id", id);
    if (data.assignedTo.length > 0) {
      const { error } = await supabase
        .from("task_assignments")
        .insert(data.assignedTo.map((profileId) => ({ task_id: id, profile_id: profileId })));
      if (error) throw error;
    }
  }
}

// ── Task instances ────────────────────────────────────────────

const DOW_MAP: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getTodayDow(): DayOfWeek {
  return DOW_MAP[new Date().getDay()];
}

async function createTodayInstances(
  taskId: string,
  profileIds: string[],
  points: number,
  isRecurring: boolean,
  recurringPattern?: Task["recurringPattern"]
): Promise<void> {
  if (profileIds.length === 0) return;

  const todayDow = getTodayDow();
  const shouldCreate = !isRecurring || (recurringPattern?.daysOfWeek ?? []).includes(todayDow);
  if (!shouldCreate) return;

  const today = new Date().toISOString().split("T")[0];
  const defaultState = recurringPattern?.defaultState ?? "pending";

  const supabase = createClient();
  await supabase.from("task_instances").upsert(
    profileIds.map((profileId) => ({
      task_id: taskId,
      profile_id: profileId,
      date: today,
      state: defaultState,
      points_awarded: defaultState === "completed" ? points : 0,
    })),
    { onConflict: "task_id,profile_id,date", ignoreDuplicates: true }
  );
}

export async function fetchTodayInstances(profileId: string): Promise<TaskInstance[]> {
  const today = new Date().toISOString().split("T")[0];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_instances")
    .select("*")
    .eq("profile_id", profileId)
    .eq("date", today);
  if (error) throw error;
  return (data ?? []).map((ti) => toInstance(ti as SupabaseInstance));
}

export async function ensureTodayInstances(
  tasks: Task[],
  profileId: string
): Promise<TaskInstance[]> {
  const today = new Date().toISOString().split("T")[0];
  const todayDow = getTodayDow();

  const supabase = createClient();
  // Fetch existing instances for today
  const { data: existing } = await supabase
    .from("task_instances")
    .select("task_id")
    .eq("profile_id", profileId)
    .eq("date", today);
  const existingTaskIds = new Set((existing ?? []).map((e: { task_id: string }) => e.task_id));

  // Find tasks that should have an instance today but don't
  const toCreate = tasks.filter((t) => {
    if (!t.assignedTo.includes(profileId)) return false;
    if (!t.isActive) return false;
    if (existingTaskIds.has(t.id)) return false;
    if (!t.isRecurring) return false;
    return (t.recurringPattern?.daysOfWeek ?? []).includes(todayDow);
  });

  if (toCreate.length > 0) {
    const { data: created, error } = await supabase
      .from("task_instances")
      .insert(
        toCreate.map((t) => ({
          task_id: t.id,
          profile_id: profileId,
          date: today,
          state: t.recurringPattern?.defaultState ?? "pending",
          points_awarded: t.recurringPattern?.defaultState === "completed" ? t.points : 0,
        }))
      )
      .select();
    if (error) throw error;
  }

  return fetchTodayInstances(profileId);
}

export async function syncInstanceState(
  instanceId: string,
  state: TaskState,
  pointsAwarded: number,
  profileId: string,
  newBalance: number
): Promise<void> {
  const supabase = createClient();

  const { error: instanceError } = await supabase
    .from("task_instances")
    .update({ state, points_awarded: pointsAwarded })
    .eq("id", instanceId);
  if (instanceError) throw instanceError;

  const { error: balanceError } = await supabase
    .from("profiles")
    .update({ points_balance: newBalance })
    .eq("id", profileId);
  if (balanceError) throw balanceError;
}
