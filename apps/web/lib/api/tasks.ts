import { createClient } from "@/lib/supabase/client";
import { recordTransaction } from "@/lib/api/transactions";
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
  deadline: string | null;
  penalty_points: number | null;
  default_state: "pending" | "completed";
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
    defaultState: t.default_state ?? "pending",
    deadline: t.deadline ?? undefined,
    penaltyPoints: t.penalty_points ?? undefined,
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
    defaultState?: "pending" | "completed";
    deadline?: string;
    penaltyPoints?: number;
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
      default_state: data.defaultState ?? "pending",
      deadline: data.deadline ?? null,
      penalty_points: data.penaltyPoints ?? null,
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

  const fullTask = toTask({ ...task, task_assignments: data.assignedTo.map((p) => ({ profile_id: p })) } as SupabaseTask);

  if (data.isRecurring) {
    // Recurring: create instance for today if it falls on the right day
    const todayDow = getDow(new Date());
    const days = data.recurringPattern?.daysOfWeek ?? [];
    if (days.includes(todayDow)) {
      const defaultState = data.recurringPattern?.defaultState ?? "pending";
      const pointsAwarded = defaultState === "completed" ? data.points : 0;
      await supabase.from("task_instances").upsert(
        data.assignedTo.map((profileId) => ({
          task_id: task.id, profile_id: profileId,
          date: dateStr(new Date()), state: defaultState, points_awarded: pointsAwarded,
        })),
        { onConflict: "task_id,profile_id,date", ignoreDuplicates: true },
      );
      if (defaultState === "completed" && pointsAwarded > 0) {
        for (const profileId of data.assignedTo) {
          const balance = await fetchBalance(supabase, profileId);
          await applyBalanceDelta(supabase, profileId, balance, pointsAwarded, `Tarea completada: ${data.title}`, "✅");
        }
      }
    }
  } else {
    // Non-recurring: create one instance per assigned profile (C1)
    for (const profileId of data.assignedTo) {
      await createNonRecurringInstance(supabase, fullTask, profileId);
    }
  }

  return fullTask;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient();
  // Assignments are deleted via cascade; instances are kept for history
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
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
    defaultState?: "pending" | "completed";
    deadline?: string | null;
    penaltyPoints?: number | null;
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
  if (data.deadline !== undefined) patch.deadline = data.deadline ?? null;
  if (data.defaultState !== undefined) patch.default_state = data.defaultState;
  if (data.penaltyPoints !== undefined) patch.penalty_points = data.penaltyPoints ?? null;
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

function getDow(date: Date): DayOfWeek {
  return DOW_MAP[date.getDay()];
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

// Award or deduct points and record a transaction (fire-and-forget safe)
async function applyBalanceDelta(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  currentBalance: number,
  delta: number,
  description: string,
  emoji: string,
): Promise<number> {
  if (delta === 0) return currentBalance;
  const newBalance = currentBalance + delta;
  await supabase.from("profiles").update({ points_balance: newBalance }).eq("id", profileId);
  await recordTransaction({ profileId, amount: delta, type: "task", description, emoji, balanceAfter: newBalance })
    .catch(() => {});
  return newBalance;
}

// Fetch current points_balance for a profile
async function fetchBalance(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<number> {
  const { data } = await supabase.from("profiles").select("points_balance").eq("id", profileId).single();
  return (data as { points_balance: number } | null)?.points_balance ?? 0;
}

// ── C1: create instance for a non-recurring task just added ──
async function createNonRecurringInstance(
  supabase: ReturnType<typeof createClient>,
  task: Task,
  profileId: string,
): Promise<void> {
  const today = dateStr(new Date());
  const defaultState = (task.defaultState ?? "pending") as TaskState;
  const pointsAwarded = defaultState === "completed" ? task.points : 0;

  const { error } = await supabase.from("task_instances").upsert(
    [{ task_id: task.id, profile_id: profileId, date: today, state: defaultState, points_awarded: pointsAwarded }],
    { onConflict: "task_id,profile_id,date", ignoreDuplicates: true },
  );
  if (error) throw error;

  if (defaultState === "completed" && pointsAwarded > 0) {
    const balance = await fetchBalance(supabase, profileId);
    await applyBalanceDelta(supabase, profileId, balance, pointsAwarded, `Tarea completada: ${task.title}`, "✅");
  }
}

// ── C6+C8: backfill instances from task.createdAt to targetDate ──
export async function backfillInstances(
  tasks: Task[],
  profileId: string,
  targetDate: Date = new Date(),
): Promise<TaskInstance[]> {
  const supabase = createClient();
  const today = dateStr(new Date());
  const target = dateStr(targetDate);

  // Check vacation mode
  const { data: profileData } = await supabase
    .from("profiles")
    .select("vacation_until")
    .eq("id", profileId)
    .single();
  const vacationUntil = (profileData as { vacation_until: string | null } | null)?.vacation_until ?? null;

  // Fetch all existing instances for this profile up to targetDate
  const { data: existing } = await supabase
    .from("task_instances")
    .select("id, task_id, date, state, points_awarded")
    .eq("profile_id", profileId)
    .lte("date", target);

  type ExistingRow = { id: string; task_id: string; date: string; state: string; points_awarded: number };
  const existingMap = new Map<string, ExistingRow>();
  for (const row of (existing ?? []) as ExistingRow[]) {
    existingMap.set(`${row.task_id}::${row.date}`, row);
  }

  const toInsert: { task_id: string; profile_id: string; date: string; state: string; points_awarded: number }[] = [];
  const toPendingFail: { id: string; penaltyPoints: number; profileId: string; taskTitle: string }[] = [];

  for (const task of tasks) {
    if (!task.assignedTo.includes(profileId)) continue;
    if (!task.isActive) continue;

    // Non-recurring tasks: ensure instance exists (may have failed at creation)
    if (!task.isRecurring) {
      const createdDate = task.createdAt.slice(0, 10);
      const key = `${task.id}::${createdDate}`;
      if (!existingMap.has(key)) {
        const defaultState = (task.defaultState ?? "pending") as string;
        const pointsAwarded = defaultState === "completed" ? task.points : 0;
        toInsert.push({
          task_id: task.id,
          profile_id: profileId,
          date: createdDate,
          state: defaultState,
          points_awarded: pointsAwarded,
        });
      }
      continue;
    }

    const days = task.recurringPattern?.daysOfWeek ?? [];
    const defaultState = task.recurringPattern?.defaultState ?? "pending";
    const taskStart = new Date(task.createdAt);
    const taskStartStr = dateStr(taskStart);

    // Iterate day by day from task creation to targetDate
    let cur = new Date(taskStart);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(0, 0, 0, 0);

    while (cur <= end) {
      const ds = dateStr(cur);
      // Skip vacation days — no instances created, no penalties
      const isOnVacation = vacationUntil && ds <= vacationUntil;
      if (!isOnVacation && ds >= taskStartStr && days.includes(getDow(cur))) {
        const key = `${task.id}::${ds}`;
        const existing = existingMap.get(key);

        if (!existing) {
          // Missing instance — create it
          const isPast = ds < today;
          // Past days with defaultState=pending → create as failed directly
          const state = isPast && defaultState === "pending" ? "failed" : defaultState;
          const pointsAwarded = state === "completed" ? task.points
            : state === "failed" ? -(task.penaltyPoints ?? task.points)
            : 0;
          toInsert.push({ task_id: task.id, profile_id: profileId, date: ds, state, points_awarded: pointsAwarded });
        } else if (existing.state === "pending" && ds < today) {
          // C8: existing pending instance from a past day → auto-fail
          const penalty = task.penaltyPoints ?? task.points;
          toPendingFail.push({ id: existing.id, penaltyPoints: penalty, profileId, taskTitle: task.title });
        }
      }
      cur = addDays(cur, 1);
    }
  }

  // Bulk insert new instances
  if (toInsert.length > 0) {
    await supabase.from("task_instances").insert(toInsert);
    // Apply balance deltas for new completed/failed instances
    for (const row of toInsert) {
      if (row.points_awarded !== 0) {
        const task = tasks.find((t) => t.id === row.task_id);
        const balance = await fetchBalance(supabase, profileId);
        const isCompleted = row.state === "completed";
        await applyBalanceDelta(
          supabase, profileId, balance, row.points_awarded,
          isCompleted ? `Tarea completada: ${task?.title ?? ""}` : `Tarea no realizada: ${task?.title ?? ""}`,
          isCompleted ? "✅" : "❌",
        );
      }
    }
  }

  // Auto-fail existing pending instances from past days
  for (const item of toPendingFail) {
    const penalty = item.penaltyPoints;
    await supabase.from("task_instances").update({ state: "failed", points_awarded: -penalty }).eq("id", item.id);
    if (penalty > 0) {
      const balance = await fetchBalance(supabase, profileId);
      await applyBalanceDelta(supabase, profileId, balance, -penalty, `Tarea no realizada: ${item.taskTitle}`, "❌");
    }
  }

  // Return all instances up to targetDate
  const { data: all, error } = await supabase
    .from("task_instances")
    .select("*")
    .eq("profile_id", profileId)
    .lte("date", target);
  if (error) throw error;
  return (all ?? []).map((ti) => toInstance(ti as SupabaseInstance));
}

export async function fetchInstancesForDate(profileId: string, date: string): Promise<TaskInstance[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_instances")
    .select("*")
    .eq("profile_id", profileId)
    .eq("date", date);
  if (error) throw error;
  return (data ?? []).map((ti) => toInstance(ti as SupabaseInstance));
}

// ── Claim an unassigned task ─────────────────────────────────
// Creates instance as completed + awards points. Returns the new instance.
// Fails silently if someone already claimed it (unique constraint).
export async function claimTask(
  task: Task,
  profileId: string,
  date: string,
): Promise<TaskInstance | null> {
  const supabase = createClient();

  // Check if anyone already claimed this task for this date
  const { data: existing } = await supabase
    .from("task_instances")
    .select("id")
    .eq("task_id", task.id)
    .eq("date", date)
    .limit(1);

  if (existing && existing.length > 0) return null; // already claimed

  const pointsAwarded = task.points;
  const { data: instance, error } = await supabase
    .from("task_instances")
    .insert({
      task_id: task.id,
      profile_id: profileId,
      date,
      state: "completed",
      points_awarded: pointsAwarded,
    })
    .select()
    .single();

  if (error) {
    // Likely unique constraint violation — someone claimed it concurrently
    if (error.code === "23505") return null;
    throw error;
  }

  // Also add assignment so it shows in the user's history
  await supabase
    .from("task_assignments")
    .upsert({ task_id: task.id, profile_id: profileId }, { onConflict: "task_id,profile_id", ignoreDuplicates: true });

  // Award points
  const balance = await fetchBalance(supabase, profileId);
  await applyBalanceDelta(supabase, profileId, balance, pointsAwarded, `Tarea reclamada: ${task.title}`, "🙋");

  return toInstance(instance as SupabaseInstance);
}

// ── Share points with a helper ──────────��────────────────────
// Transfers `amount` points from the completer to the helper.
export async function shareTaskPoints(
  fromProfileId: string,
  toProfileId: string,
  amount: number,
  taskTitle: string,
  helperName: string,
  giverName: string,
): Promise<void> {
  const supabase = createClient();
  if (amount <= 0) return;

  // Deduct from giver
  const giverBalance = await fetchBalance(supabase, fromProfileId);
  const newGiverBalance = Math.max(0, giverBalance - amount);
  await supabase.from("profiles").update({ points_balance: newGiverBalance }).eq("id", fromProfileId);
  await recordTransaction({
    profileId: fromProfileId,
    amount: -amount,
    type: "task",
    description: `Puntos compartidos con ${helperName}: ${taskTitle}`,
    emoji: "🤝",
    balanceAfter: newGiverBalance,
  }).catch(() => {});

  // Add to helper
  const helperBalance = await fetchBalance(supabase, toProfileId);
  const newHelperBalance = helperBalance + amount;
  await supabase.from("profiles").update({ points_balance: newHelperBalance }).eq("id", toProfileId);
  await recordTransaction({
    profileId: toProfileId,
    amount,
    type: "task",
    description: `Ayuda en tarea de ${giverName}: ${taskTitle}`,
    emoji: "🤝",
    balanceAfter: newHelperBalance,
  }).catch(() => {});
}

// ── C7: syncInstanceState with 4-state transition table ──
//
// Transition table (pointsDelta):
//   pending   → completed : +points
//   pending   → failed    : -penalty
//   pending   → cancelled : 0
//   completed → pending   : -points
//   completed → failed    : -points - penalty
//   completed → cancelled : -points
//   failed    → pending   : +penalty
//   failed    → completed : +points + penalty
//   failed    → cancelled : +penalty
//   cancelled → pending   : 0
//   cancelled → completed : +points
//   cancelled → failed    : -penalty
export async function syncInstanceState(
  instanceId: string,
  newState: TaskState,
  task: { points: number; penaltyPoints?: number; title?: string },
  profileId: string,
  prevState: TaskState,
): Promise<void> {
  const supabase = createClient();
  const penalty = task.penaltyPoints ?? task.points;

  // Determine points_awarded for the new state
  const pointsAwarded =
    newState === "completed" ? task.points :
    newState === "failed"    ? -penalty :
    0;

  const { error: instanceError } = await supabase
    .from("task_instances")
    .update({ state: newState, points_awarded: pointsAwarded })
    .eq("id", instanceId);
  if (instanceError) throw instanceError;

  // Calculate balance delta based on transition
  let delta = 0;
  const prevPoints = prevState === "completed" ? task.points : prevState === "failed" ? -penalty : 0;
  delta = pointsAwarded - prevPoints;

  if (delta !== 0) {
    const balance = await fetchBalance(supabase, profileId);
    const description =
      newState === "completed" ? `Tarea completada: ${task.title ?? "Tarea"}` :
      newState === "failed"    ? `Tarea no realizada: ${task.title ?? "Tarea"}` :
      newState === "cancelled" ? `Tarea cancelada: ${task.title ?? "Tarea"}` :
                                 `Tarea revertida: ${task.title ?? "Tarea"}`;
    const emoji =
      newState === "completed" ? "✅" :
      newState === "failed"    ? "❌" :
      newState === "cancelled" ? "🚫" : "↩️";
    await applyBalanceDelta(supabase, profileId, balance, delta, description, emoji);
  }
}
