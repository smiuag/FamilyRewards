import { createClient } from "@/lib/supabase/client";
import { createTask, updateTask } from "@/lib/api/tasks";
import type { TaskTemplate, TaskTemplateItem, Task, RecurringPattern } from "@/lib/types";

// ── Mappers ──────────────────────────────────────────────────

interface SupabaseTemplate {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  emoji: string;
  created_by: string | null;
  created_at: string;
  task_template_items: SupabaseTemplateItem[];
}

interface SupabaseTemplateItem {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  points: number;
  recurring_pattern: RecurringPattern;
  penalty_points: number | null;
}

function toTemplate(t: SupabaseTemplate): TaskTemplate {
  return {
    id: t.id,
    familyId: t.family_id,
    name: t.name,
    description: t.description ?? undefined,
    emoji: t.emoji,
    createdBy: t.created_by ?? "",
    createdAt: t.created_at,
    items: (t.task_template_items ?? []).map(toTemplateItem),
  };
}

function toTemplateItem(i: SupabaseTemplateItem): TaskTemplateItem {
  return {
    id: i.id,
    templateId: i.template_id,
    title: i.title,
    description: i.description ?? undefined,
    points: i.points,
    recurringPattern: i.recurring_pattern,
    penaltyPoints: i.penalty_points ?? undefined,
  };
}

// ── Fetch all templates for the family ───────────────────────

export async function fetchFamilyTemplates(): Promise<TaskTemplate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("task_templates")
    .select("*, task_template_items(*)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => toTemplate(t as SupabaseTemplate));
}

// ── Create a new template ────────────────────────────────────

export async function createTemplate(
  familyId: string,
  createdBy: string,
  data: {
    name: string;
    description?: string;
    emoji: string;
    items: Omit<TaskTemplateItem, "id" | "templateId">[];
  }
): Promise<TaskTemplate> {
  const supabase = createClient();

  const { data: template, error } = await supabase
    .from("task_templates")
    .insert({
      family_id: familyId,
      name: data.name,
      description: data.description || null,
      emoji: data.emoji,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;

  let items: SupabaseTemplateItem[] = [];
  if (data.items.length > 0) {
    const { data: insertedItems, error: itemsError } = await supabase
      .from("task_template_items")
      .insert(
        data.items.map((item) => ({
          template_id: template.id,
          title: item.title,
          description: item.description || null,
          points: item.points,
          recurring_pattern: item.recurringPattern,
          penalty_points: item.penaltyPoints ?? null,
        }))
      )
      .select();
    if (itemsError) throw itemsError;
    items = (insertedItems ?? []) as SupabaseTemplateItem[];
  }

  return toTemplate({ ...template, task_template_items: items } as SupabaseTemplate);
}

// ── Save current recurring config as a template ──────────────

export async function saveCurrentConfigAsTemplate(
  familyId: string,
  createdBy: string,
  name: string,
  description: string,
  emoji: string,
  recurringTasks: Task[]
): Promise<TaskTemplate> {
  const activeTasks = recurringTasks.filter((t) => t.isRecurring && t.isActive);

  return createTemplate(familyId, createdBy, {
    name,
    description,
    emoji,
    items: activeTasks.map((t) => ({
      title: t.title,
      description: t.description,
      points: t.points,
      recurringPattern: t.recurringPattern ?? {
        daysOfWeek: [],
        defaultState: "pending" as const,
      },
      penaltyPoints: t.penaltyPoints,
    })),
  });
}

// ── Update template metadata + items ─────────────────────────

export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    emoji?: string;
    items?: Omit<TaskTemplateItem, "id" | "templateId">[];
  }
): Promise<void> {
  const supabase = createClient();

  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.emoji !== undefined) patch.emoji = data.emoji;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("task_templates")
      .update(patch)
      .eq("id", templateId);
    if (error) throw error;
  }

  if (data.items !== undefined) {
    // Replace all items
    await supabase
      .from("task_template_items")
      .delete()
      .eq("template_id", templateId);

    if (data.items.length > 0) {
      const { error } = await supabase
        .from("task_template_items")
        .insert(
          data.items.map((item) => ({
            template_id: templateId,
            title: item.title,
            description: item.description || null,
            points: item.points,
            recurring_pattern: item.recurringPattern,
            penalty_points: item.penaltyPoints ?? null,
          }))
        );
      if (error) throw error;
    }
  }
}

// ── Delete a template ────────────────────────────────────────

export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("task_templates")
    .delete()
    .eq("id", templateId);
  if (error) throw error;
}

// ── Apply a template ─────────────────────────────────────────
// 1. Deactivate all recurring tasks for the family
// 2. Create new recurring tasks from template items for selected members

export async function applyTemplate(
  template: TaskTemplate,
  familyId: string,
  adminId: string,
  memberIds: string[],
  allTasks: Task[]
): Promise<Task[]> {
  // Step 1: Deactivate all active recurring tasks
  const recurringTasks = allTasks.filter((t) => t.isRecurring && t.isActive);
  for (const task of recurringTasks) {
    await updateTask(task.id, { isActive: false });
  }

  // Step 2: Create new tasks from template items
  const createdTasks: Task[] = [];
  for (const item of template.items) {
    const task = await createTask(familyId, adminId, {
      title: item.title,
      description: item.description,
      points: item.points,
      assignedTo: memberIds,
      isRecurring: true,
      recurringPattern: item.recurringPattern,
      penaltyPoints: item.penaltyPoints,
    });
    createdTasks.push(task);
  }

  return createdTasks;
}
