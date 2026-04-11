import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { familyId, invitedByProfileId, email, role } = await req.json();

    if (!familyId || !invitedByProfileId || !email || !role) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Crear registro de invitación en la BD
    const { data: invite, error: inviteError } = await supabase
      .from("family_invitations")
      .insert({
        family_id: familyId,
        email,
        role,
        invited_by: invitedByProfileId,
      })
      .select("token")
      .single();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const token = (invite as { token: string }).token;
    const origin = req.nextUrl.origin;
    const joinUrl = `${origin}/es/join?token=${token}`;

    // Enviar email de invitación vía Supabase Auth Admin
    // redirectTo goes to /auth/confirm so the PKCE code is exchanged properly
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/confirm`,
      data: { invitation_token: token },
    });

    if (emailError) {
      // La invitación se creó pero el email falló → devolver el enlace para que el admin lo comparta manualmente
      return NextResponse.json(
        { token, link: joinUrl, emailWarning: emailError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({ token, link: joinUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
