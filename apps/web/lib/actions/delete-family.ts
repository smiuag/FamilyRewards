"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Borra toda la familia: elimina auth users de los miembros y la familia
 * (cascade borra profiles, tasks, rewards, invitations, etc).
 * Requiere que el nombre de confirmación coincida con el nombre de la familia.
 */
export async function deleteFamilyAction(params: {
  familyId: string;
  confirmName: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Verificar que el nombre coincide
  const { data: family } = await supabase
    .from("families")
    .select("name")
    .eq("id", params.familyId)
    .single();

  if (!family) throw new Error("Familia no encontrada");
  if (family.name.trim().toLowerCase() !== params.confirmName.trim().toLowerCase()) {
    throw new Error("El nombre no coincide");
  }

  // 2. Obtener todos los auth users de la familia
  const { data: profiles } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("family_id", params.familyId)
    .not("auth_user_id", "is", null);

  // 3. Borrar la familia (cascade borra profiles, tasks, rewards, etc.)
  const { error: deleteError } = await supabase
    .from("families")
    .delete()
    .eq("id", params.familyId);

  if (deleteError) {
    throw new Error("Error al borrar la familia: " + deleteError.message);
  }

  // 4. Borrar auth users de los miembros
  for (const profile of profiles ?? []) {
    if (profile.auth_user_id) {
      await supabase.auth.admin.deleteUser(profile.auth_user_id).catch(() => {});
    }
  }
}
