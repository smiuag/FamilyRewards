"use client";

import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface Props {
  t: {
    title: string;
    subtitle: string;
    description: string;
    adminBadge: string;
    memberBadge: string;
  };
}

export default function LoginClient({ t }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { users, login } = useAppStore();

  const handleLogin = (userId: string) => {
    login(userId);
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            {t.title}
          </h1>
          <p className="text-2xl font-semibold text-primary mt-1">
            {t.subtitle}
          </p>
          <p className="text-muted-foreground mt-2">{t.description}</p>
        </div>

        {/* User cards */}
        <div className="grid gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="group relative flex items-center gap-5 p-5 rounded-2xl bg-white border-2 border-transparent shadow-sm hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-200 text-left"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-4xl shadow-inner">
                {user.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-foreground">
                    {user.name}
                  </span>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.role === "admin" ? t.adminBadge : t.memberBadge}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="font-medium text-primary">
                    {user.pointsBalance.toLocaleString()}
                  </span>
                  <span>puntos acumulados</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Familia García · FamilyRewards v1.0
        </p>
      </div>
    </div>
  );
}
