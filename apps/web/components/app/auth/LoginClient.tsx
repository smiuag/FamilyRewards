"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Star, Mail, Lock, Eye, EyeOff } from "lucide-react";
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

export default function LoginClient() {
  const t = useTranslations("login");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "es";

  const confirmationFailed = searchParams.get("error") === "confirmation_failed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/profile-select`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Star className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">FamilyRewards</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("signInSubtitle")}</p>
        </div>

        {confirmationFailed && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center mb-4">
            {t("confirmationFailed")}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">{t("emailLabel")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">{t("passwordLabel")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-sm text-primary-foreground bg-primary transition-all",
              loading ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90 active:scale-[0.98]"
            )}
          >
            {loading ? t("submitting") : t("submit")}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t("orSeparator")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-sm border bg-white transition-all flex items-center justify-center gap-2",
              loading ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/40 active:scale-[0.98]"
            )}
          >
            <GoogleIcon />
            {t("continueWithGoogle")}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {t("firstTime")}{" "}
          <Link href={`/${locale}/register`} className="text-primary font-semibold hover:underline">
            {t("createFamily")}
          </Link>
        </p>
      </div>
    </main>
  );
}
