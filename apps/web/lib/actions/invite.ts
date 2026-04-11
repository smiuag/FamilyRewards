"use server";

import { createClient } from "@supabase/supabase-js";

export async function sendInviteAction(params: {
  familyId: string;
  invitedByProfileId: string;
  profileId: string;
  email: string;
  role: "admin" | "member";
  origin: string;
}): Promise<{ token: string; link: string; emailWarning?: string }> {
  const { familyId, invitedByProfileId, profileId, email, role, origin } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  const { data: invite, error: inviteError } = await supabase
    .from("family_invitations")
    .insert({
      family_id: familyId,
      email,
      role,
      invited_by: invitedByProfileId,
      profile_id: profileId,
    })
    .select("token")
    .single();

  if (inviteError) throw new Error(inviteError.message);

  const token = (invite as { token: string }).token;
  const joinUrl = `${origin}/es/join?token=${token}`;

  // redirectTo apunta a /auth/confirm para que Supabase intercambie el código PKCE
  // y establezca la sesión del nuevo usuario. El trigger handle_new_auth_user ya
  // aceptó la invitación y creó/vinculó el perfil al llamar inviteUserByEmail.
  const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  if (emailError) {
    return { token, link: joinUrl, emailWarning: emailError.message };
  }

  return { token, link: joinUrl };
}
