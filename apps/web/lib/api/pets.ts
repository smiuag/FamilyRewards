import { createClient } from "@/lib/supabase/client";
import { recordTransaction } from "@/lib/api/transactions";
import { getStageForCarePoints, PET_STAGE_THRESHOLDS } from "@/lib/pet/constants";
import type {
  FamilyPet,
  PetAccessory,
  PetInventoryItem,
  PetCareLogEntry,
  PetSpecies,
  PetStage,
  PetMood,
  AccessorySlot,
  TaskInstance,
} from "@/lib/types";

// ── Supabase row interfaces ────────────────────────────────

interface SupabasePet {
  id: string;
  family_id: string;
  name: string;
  species: PetSpecies | null;
  stage: PetStage;
  care_points: number;
  primary_color: string;
  secondary_color: string;
  eye_style: string;
  active_accessories: Record<AccessorySlot, string | null>;
  hatched_at: string | null;
  created_at: string;
}

interface SupabaseAccessory {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  description_en: string | null;
  slot: AccessorySlot;
  emoji: string;
  points_cost: number;
  svg_key: string;
}

interface SupabaseInventoryItem {
  id: string;
  family_id: string;
  accessory_id: string;
  purchased_by: string;
  purchased_at: string;
}

interface SupabaseCareLog {
  id: string;
  family_id: string;
  profile_id: string;
  amount: number;
  source: string;
  created_at: string;
}

// ── Mappers ────────────────────────────────────────────────

function toPet(r: SupabasePet): FamilyPet {
  return {
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    species: r.species,
    stage: r.stage,
    carePoints: r.care_points,
    primaryColor: r.primary_color,
    secondaryColor: r.secondary_color,
    eyeStyle: r.eye_style,
    activeAccessories: r.active_accessories,
    hatchedAt: r.hatched_at,
    createdAt: r.created_at,
  };
}

function toAccessory(r: SupabaseAccessory): PetAccessory {
  return {
    id: r.id,
    name: r.name,
    nameEn: r.name_en,
    description: r.description ?? undefined,
    descriptionEn: r.description_en ?? undefined,
    slot: r.slot,
    emoji: r.emoji,
    pointsCost: r.points_cost,
    svgKey: r.svg_key,
  };
}

function toInventoryItem(r: SupabaseInventoryItem): PetInventoryItem {
  return {
    id: r.id,
    familyId: r.family_id,
    accessoryId: r.accessory_id,
    purchasedBy: r.purchased_by,
    purchasedAt: r.purchased_at,
  };
}

function toCareLog(r: SupabaseCareLog): PetCareLogEntry {
  return {
    id: r.id,
    familyId: r.family_id,
    profileId: r.profile_id,
    amount: r.amount,
    source: r.source,
    createdAt: r.created_at,
  };
}

// ── Pet CRUD ───────────────────────────────────────────────

export async function fetchFamilyPet(): Promise<FamilyPet | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_pets")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? toPet(data as SupabasePet) : null;
}

export async function createFamilyPet(
  familyId: string,
  name: string
): Promise<FamilyPet> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("family_pets")
    .insert({ family_id: familyId, name })
    .select()
    .single();
  if (error) throw error;
  return toPet(data as SupabasePet);
}

export async function updateFamilyPet(
  petId: string,
  patch: Partial<{
    name: string;
    species: PetSpecies;
    stage: PetStage;
    carePoints: number;
    primaryColor: string;
    secondaryColor: string;
    eyeStyle: string;
    activeAccessories: Record<AccessorySlot, string | null>;
    hatchedAt: string;
  }>
): Promise<void> {
  const supabase = createClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.species !== undefined) dbPatch.species = patch.species;
  if (patch.stage !== undefined) dbPatch.stage = patch.stage;
  if (patch.carePoints !== undefined) dbPatch.care_points = patch.carePoints;
  if (patch.primaryColor !== undefined) dbPatch.primary_color = patch.primaryColor;
  if (patch.secondaryColor !== undefined) dbPatch.secondary_color = patch.secondaryColor;
  if (patch.eyeStyle !== undefined) dbPatch.eye_style = patch.eyeStyle;
  if (patch.activeAccessories !== undefined) dbPatch.active_accessories = patch.activeAccessories;
  if (patch.hatchedAt !== undefined) dbPatch.hatched_at = patch.hatchedAt;
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase.from("family_pets").update(dbPatch).eq("id", petId);
  if (error) throw error;
}

// ── Species selection ──────────────────────────────────────

export async function choosePetSpecies(
  petId: string,
  species: PetSpecies,
  primaryColor: string,
  secondaryColor: string
): Promise<void> {
  await updateFamilyPet(petId, { species, primaryColor, secondaryColor });
}

// ── Care points ────────────────────────────────────────────

export async function addCarePoints(
  petId: string,
  profileId: string,
  familyId: string,
  amount: number,
  currentCarePoints: number
): Promise<{ newCarePoints: number; newStage: PetStage | null }> {
  const supabase = createClient();
  const newTotal = Math.max(0, currentCarePoints + amount);
  const newStage = getStageForCarePoints(newTotal);
  const oldStage = getStageForCarePoints(currentCarePoints);

  // Atomic increment
  const updatePatch: Record<string, unknown> = { care_points: newTotal };
  if (newStage !== oldStage) {
    updatePatch.stage = newStage;
    if (newStage === "baby") {
      updatePatch.hatched_at = new Date().toISOString();
    }
  }

  const { error: petError } = await supabase
    .from("family_pets")
    .update(updatePatch)
    .eq("id", petId);
  if (petError) throw petError;

  // Log the care contribution
  const { error: logError } = await supabase
    .from("pet_care_log")
    .insert({ family_id: familyId, profile_id: profileId, amount, source: "task" });
  if (logError) throw logError;

  return {
    newCarePoints: newTotal,
    newStage: newStage !== oldStage ? newStage : null,
  };
}

// ── Accessories catalog ────────────────────────────────────

export async function fetchAccessoryCatalog(): Promise<PetAccessory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pet_accessories")
    .select("*")
    .order("slot")
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => toAccessory(r as SupabaseAccessory));
}

// ── Inventory ──────────────────────────────────────────────

export async function fetchFamilyInventory(): Promise<PetInventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pet_inventory")
    .select("*")
    .order("purchased_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toInventoryItem(r as SupabaseInventoryItem));
}

export async function purchaseAccessory(
  accessoryId: string,
  familyId: string,
  profileId: string,
  pointsCost: number,
  currentBalance: number,
  accessoryName: string,
  accessoryEmoji: string
): Promise<PetInventoryItem> {
  const supabase = createClient();
  const newBalance = Math.max(0, currentBalance - pointsCost);

  // Insert inventory item
  const { data: item, error: invError } = await supabase
    .from("pet_inventory")
    .insert({
      family_id: familyId,
      accessory_id: accessoryId,
      purchased_by: profileId,
    })
    .select()
    .single();
  if (invError) throw invError;

  // Deduct points
  const { error: balError } = await supabase
    .from("profiles")
    .update({ points_balance: newBalance })
    .eq("id", profileId);
  if (balError) throw balError;

  // Record transaction
  await recordTransaction({
    profileId,
    amount: -pointsCost,
    type: "reward",
    description: `Accesorio mascota: ${accessoryName}`,
    emoji: accessoryEmoji,
    balanceAfter: newBalance,
  }).catch(() => {});

  return toInventoryItem(item as SupabaseInventoryItem);
}

// ── Equip/unequip ──────────────────────────────────────────

export async function equipAccessory(
  petId: string,
  slot: AccessorySlot,
  accessoryId: string | null,
  currentAccessories: Record<AccessorySlot, string | null>
): Promise<void> {
  const updated = { ...currentAccessories, [slot]: accessoryId };
  await updateFamilyPet(petId, { activeAccessories: updated });
}

// ── Care log ───────────────────────────────────────────────

export async function fetchCareLog(limit = 50): Promise<PetCareLogEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pet_care_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => toCareLog(r as SupabaseCareLog));
}

// ── Mood calculation (client-side) ─────────────────────────

export function calculatePetMood(
  taskInstances: TaskInstance[],
  today: string
): PetMood {
  const todayInstances = taskInstances.filter((ti) => ti.date === today);
  if (todayInstances.length === 0) return "sad";
  const completed = todayInstances.filter((ti) => ti.state === "completed").length;
  const ratio = completed / todayInstances.length;
  if (ratio > 0.5) return "happy";
  if (ratio >= 0.25) return "neutral";
  return "sad";
}
