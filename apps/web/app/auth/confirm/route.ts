import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  // Sign out existing session first so the new one takes over
  await supabase.auth.signOut();

  // Flujo PKCE: Supabase redirige con ?code=xxx
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/es/profile-select?fresh=1", request.url));
    }
    // Debug: show error in URL so we can see what's failing
    return NextResponse.redirect(
      new URL(`/es/login?error=code_exchange_failed&detail=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // Flujo token_hash: verificación directa OTP
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL("/es/profile-select?fresh=1", request.url));
    }
    return NextResponse.redirect(
      new URL(`/es/login?error=otp_failed&detail=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  // No code or token_hash received — check what params Supabase actually sent
  return NextResponse.redirect(
    new URL(`/es/login?error=no_params&received=${encodeURIComponent(searchParams.toString())}`, request.url)
  );
}
