"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Star } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SessionGuard from "./SessionGuard";
import OnboardingWizard from "@/components/app/onboarding/OnboardingWizard";

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { currentUser, onboardingCompleted } = useAppStore();

  return (
    <SessionGuard>
      {!currentUser ? null : (
        <div className="flex h-screen bg-background overflow-hidden">
          {/* Onboarding wizard (first time only) */}
          {!onboardingCompleted && <OnboardingWizard />}

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:flex-shrink-0">
            <Sidebar />
          </aside>

          {/* Main content */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Top bar (mobile) */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentUser.avatar}</span>
                <span className="font-bold text-foreground">{currentUser.name}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-primary font-semibold">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span>{currentUser.pointsBalance.toLocaleString()} pts</span>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
              {children}
            </main>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
              <MobileNav />
            </nav>
          </div>
        </div>
      )}
    </SessionGuard>
  );
}
