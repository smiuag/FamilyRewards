"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Acepta una invitación: vincula el auth user al perfil existente de la familia
 * y limpia la familia/perfil auto-creados por el trigger handle_new_auth_user.
 */
export async function acceptInvitationAction(params: {
  token: string;
  authUserId: string;
  name?: string | null;
  avatar?: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Buscar la invitación por token
  const { data: invitation, error } = await supabase
    .from("family_invitations")
    .select("id, family_id, profile_id, role, accepted_at, expires_at")
    .eq("token", params.token)
    .single();

  if (error || !invitation) throw new Error("Invitación no encontrada");
  if (invitation.accepted_at) throw new Error("Invitación ya aceptada");
  if (new Date(invitation.expires_at) < new Date()) throw new Error("Invitación expirada");

  // 2. Marcar invitación como aceptada
  await supabase
    .from("family_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  // 3. Vincular el perfil existente al auth user
  if (invitation.profile_id) {
    const updates: Record<string, string> = { auth_user_id: params.authUserId };
    if (params.name) updates.name = params.name;
    if (params.avatar) updates.avatar = params.avatar;

    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", invitation.profile_id)
      .is("auth_user_id", null);
  } else {
    // Invitación genérica (sin perfil asociado): crear perfil en la familia
    await supabase.from("profiles").insert({
      auth_user_id: params.authUserId,
      family_id: invitation.family_id,
      name: params.name || "Nuevo miembro",
      avatar: params.avatar || "😊",
      role: invitation.role,
    });
  }

  // 4. Limpiar familia/perfil auto-creados por el trigger
  //    El trigger crea una familia nueva cuando no encuentra la invitación
  const { data: autoProfiles } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("auth_user_id", params.authUserId)
    .neq("family_id", invitation.family_id);

  if (autoProfiles && autoProfiles.length > 0) {
    for (const autoProfile of autoProfiles) {
      await supabase.from("profiles").delete().eq("id", autoProfile.id);
      // Borrar la familia auto-creada si quedó vacía
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", autoProfile.family_id);
      if (count === 0) {
        await supabase.from("families").delete().eq("id", autoProfile.family_id);
      }
    }
  }

  return { familyId: invitation.family_id };
}
