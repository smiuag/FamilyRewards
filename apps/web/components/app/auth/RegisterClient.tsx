"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Star, Mail, Lock, Eye, EyeOff, User, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const AVATARS = [
  "👦","👧","👨","👩","🧔","👱","👴","👵","🧒","👶",
  "🧑","🧕","🦸","🧙","👮","🧑‍🍳","🧑‍🎨","🧑‍💻","🥷","🧑‍🚀",
];

type Step = "register" | "confirming";

export default function RegisterClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const [step, setStep] = useState<Step>("register");

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👨");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (step !== "confirming") return;

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        router.push(`/${locale}/profile-select`);
      }
    });

    return () => subscription.unsubscribe();
  }, [step, locale, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          name: name.trim(),
          avatar,
        },
      },
    });

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Ya existe una cuenta con ese email."
          : "Error al crear la cuenta. Inténtalo de nuevo."
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(`/${locale}/profile-select`);
      return;
    }

    setLoading(false);
    setResendCooldown(60);
    setStep("confirming");
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  };

  const handleResend = async () => {
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResendCooldown(60);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">FamilyRewards</h1>
          <p className="text-muted-foreground mt-1 text-sm">Crea tu familia y empieza a motivar</p>
        </div>

        {/* REGISTRO */}
        {step === "register" && (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tu avatar</label>
                <div className="grid grid-cols-10 gap-1">
                  {AVATARS.map((a) => (
                    <button key={a} type="button" onClick={() => setAvatar(a)}
                      className={cn("text-xl p-1 rounded-lg transition-all", avatar === a ? "bg-primary/15 ring-2 ring-primary scale-110" : "hover:bg-muted")}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Tu nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ana" required autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com" required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <button type="submit" disabled={loading || !name.trim()}
                className={cn("w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-primary transition-all flex items-center justify-center gap-2",
                  loading || !name.trim() ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90 active:scale-[0.98]")}>
                {loading ? "Creando..." : "Crear familia"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">o</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button type="button" onClick={handleGoogleRegister} disabled={loading}
                className={cn(
                  "w-full py-2.5 rounded-xl font-semibold text-sm border bg-white transition-all flex items-center justify-center gap-2",
                  loading ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/40 active:scale-[0.98]"
                )}>
                <GoogleIcon />
                Continuar con Google
              </button>
            </form>
          </div>
        )}

        {/* CONFIRMAR EMAIL */}
        {step === "confirming" && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold">Confirma tu email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hemos enviado un enlace de confirmación a
              </p>
              <p className="font-semibold text-sm mt-0.5">{email}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left space-y-1.5">
              <p className="text-xs font-semibold text-amber-800">¿No ves el email?</p>
              <p className="text-xs text-amber-700">· Revisa la carpeta de <strong>spam o correo no deseado</strong></p>
              <p className="text-xs text-amber-700">· Puede tardar unos minutos en llegar</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Esperando confirmación...
            </div>

            <p className="text-xs text-muted-foreground">
              En cuanto confirmes el email, esta pantalla avanzará sola.
            </p>

            <button onClick={handleResend} disabled={resendCooldown > 0}
              className={cn(
                "flex items-center gap-1.5 mx-auto text-sm font-medium transition-colors",
                resendCooldown > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
              )}>
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar correo"}
            </button>
          </div>
        )}

        {step !== "confirming" && (
          <p className="text-center text-sm text-muted-foreground mt-5">
            ¿Ya tienes cuenta?{" "}
            <Link href={`/${locale}/login`} className="text-primary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
