import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Redirigir al profile-select en el locale por defecto.
      // El proxy/middleware ajustará el locale si es necesario.
      return NextResponse.redirect(new URL("/es/profile-select", request.url));
    }
  }

  // Token inválido o expirado → login con mensaje de error
  return NextResponse.redirect(
    new URL("/es/login?error=confirmation_failed", request.url)
  );
}
