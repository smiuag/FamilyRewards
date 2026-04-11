"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter, useParams } from "next/navigation";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { updateFamilyName } from "@/lib/api/members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Home,
  MapPin,
  PartyPopper,
  ArrowRight,
} from "lucide-react";

type Step = "family" | "location" | "done";

export default function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const { currentUser, familyName, setFamilyName, completeOnboarding } = useAppStore();
  const { setPostalCode } = useSettingsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const [step, setStep] = useState<Step>("family");
  const [nameValue, setNameValue] = useState(familyName || "Mi familia");
  const [postalCode, setPostalCodeInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveFamilyName = async () => {
    const name = nameValue.trim() || "Mi familia";
    setSaving(true);
    if (currentUser?.familyId) {
      try {
        await updateFamilyName(currentUser.familyId, name);
        setFamilyName(name);
      } catch {
        // Si falla, al menos actualiza el store local
        setFamilyName(name);
      }
    }
    setSaving(false);
    setStep("location");
  };

  const handleSaveLocation = () => {
    if (postalCode.trim()) setPostalCode(postalCode.trim());
    setStep("done");
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push(`/${locale}/admin/members`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        {step !== "done" && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: step === "family" ? "33%" : "66%" }}
            />
          </div>
        )}

        <div className="p-7 min-h-[360px] flex flex-col">

          {/* FAMILY NAME */}
          {step === "family" && (
            <div className="flex flex-col flex-1">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">{t("welcome")}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Ponle nombre a tu familia para empezar
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <Label className="text-sm mb-1.5 block">Nombre de la familia</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveFamilyName()}
                    placeholder="Mi familia"
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mt-auto pt-5">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSaveFamilyName}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Seguir"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* LOCATION */}
          {step === "location" && (
            <div className="flex flex-col flex-1">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">{t("stepLocation")}</h2>
                  <p className="text-sm text-muted-foreground">{t("stepLocationDesc")}</p>
                </div>
              </div>

              <div className="mt-5">
                <Label className="text-sm mb-1.5 block">Codigo postal</Label>
                <Input
                  placeholder="28001"
                  value={postalCode}
                  onChange={(e) => setPostalCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveLocation()}
                  maxLength={10}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Lo usaremos para calcular los festivos locales de tu zona. Puedes dejarlo en blanco.
                </p>
              </div>

              <div className="mt-auto pt-5">
                <Button className="w-full" size="lg" onClick={handleSaveLocation}>
                  Seguir
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="flex flex-col flex-1">
              <div className="text-center space-y-2">
                <div className="text-5xl">🎉</div>
                <h2 className="text-2xl font-extrabold">{t("stepDone")}</h2>
                <p className="text-muted-foreground text-sm">{t("stepDoneDesc")}</p>
              </div>

              <div className="mt-5 bg-muted/50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Proximos pasos sugeridos</p>
                {[
                  { icon: "👨‍👩‍👧", text: "Añade a los miembros de tu familia" },
                  { icon: "📋", text: "Crea tareas y asignalas" },
                  { icon: "🎁", text: "Crea recompensas para motivar" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-muted-foreground leading-snug">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-5">
                <Button className="w-full" size="lg" onClick={handleFinish}>
                  <PartyPopper className="w-4 h-4 mr-2" />
                  {t("goToDashboard")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
