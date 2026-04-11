"use server";

import { createClient } from "@supabase/supabase-js";

export async function createInviteAction(params: {
  familyId: string;
  invitedByProfileId: string;
  profileId: string;
  email?: string;
  role: "admin" | "member";
  origin: string;
  sendEmail?: boolean;
}): Promise<{ token: string; link: string }> {
  const { familyId, invitedByProfileId, profileId, email, role, origin } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (email) {
    // Comprobar si el email ya tiene una cuenta registrada
    const { data: emailCheck } = await supabase.rpc("email_exists_in_auth", {
      p_email: email,
    });

    if (emailCheck === true) {
      throw new Error("Ya existe un usuario registrado con ese email.");
    }

    // Comprobar si ya hay una invitación pendiente para ese email en esta familia
    const { data: existingInvite } = await supabase
      .from("family_invitations")
      .select("id")
      .eq("family_id", familyId)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingInvite) {
      throw new Error("Ya hay una invitación pendiente para ese email en esta familia.");
    }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("family_invitations")
    .insert({
      family_id: familyId,
      email: email || null,
      role,
      invited_by: invitedByProfileId,
      profile_id: profileId,
    })
    .select("token")
    .single();

  if (inviteError) throw new Error(inviteError.message);

  const token = (invite as { token: string }).token;
  const joinUrl = `${origin}/es/join?token=${token}`;

  // Enviar email automáticamente vía Supabase Auth
  // El trigger encontrará la invitación por email y vinculará el perfil
  if (params.sendEmail && email) {
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/es/profile-select`,
    });
    if (emailError) {
      throw new Error(`Invitación creada pero el email falló: ${emailError.message}`);
    }
  }

  return { token, link: joinUrl };
}
