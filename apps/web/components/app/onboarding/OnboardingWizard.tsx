"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter, useParams } from "next/navigation";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { TASKS_CATALOG } from "@/lib/catalog/tasks-catalog";
import { REWARDS_CATALOG } from "@/lib/catalog/rewards-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Users,
  CheckSquare,
  Gift,
  MapPin,
  PartyPopper,
  Plus,
  X,
  Star,
} from "lucide-react";

type Step = "welcome" | "members" | "task" | "reward" | "location" | "done";

const STEPS: Step[] = ["welcome", "members", "task", "reward", "location", "done"];

const AVATARS = ["👦", "👧", "👨", "👩", "👴", "👵", "🧒", "🧑", "👱", "🦊", "🐱", "🐶"];

const COUNTRIES = [
  { code: "ES", name: "España" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "US", name: "Estados Unidos" },
  { code: "OTHER", name: "Otro" },
];

const ES_REGIONS = [
  { code: "ES-MD", name: "Madrid" },
  { code: "ES-CT", name: "Cataluña" },
  { code: "ES-AN", name: "Andalucía" },
  { code: "ES-VC", name: "Valencia" },
  { code: "ES-GA", name: "Galicia" },
  { code: "ES-PV", name: "País Vasco" },
  { code: "ES-CM", name: "Castilla-La Mancha" },
  { code: "ES-CL", name: "Castilla y León" },
  { code: "ES-AR", name: "Aragón" },
  { code: "ES-EX", name: "Extremadura" },
  { code: "ES-MU", name: "Murcia" },
  { code: "ES-CN", name: "Canarias" },
  { code: "ES-CB", name: "Cantabria" },
  { code: "ES-LO", name: "La Rioja" },
  { code: "ES-IB", name: "Baleares" },
  { code: "ES-AS", name: "Asturias" },
  { code: "ES-NA", name: "Navarra" },
];

export default function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const { users, addMember, addTask, addReward, completeOnboarding } = useAppStore();
  const { setLocation } = useSettingsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const [step, setStep] = useState<Step>("welcome");

  // Members step
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("👦");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");

  // Task step
  const [selectedTaskCatalog, setSelectedTaskCatalog] = useState<string | null>(null);
  const [customTaskName, setCustomTaskName] = useState("");
  const [customTaskPts, setCustomTaskPts] = useState("20");

  // Reward step
  const [selectedRewardCatalog, setSelectedRewardCatalog] = useState<string | null>(null);
  const [customRewardName, setCustomRewardName] = useState("");
  const [customRewardPts, setCustomRewardPts] = useState("200");

  // Location step
  const [country, setCountry] = useState("ES");
  const [region, setRegion] = useState("ES-MD");

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex) / (STEPS.length - 1)) * 100;

  const goNext = () => {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleAddMember = () => {
    if (!newName.trim()) return;
    addMember({ name: newName.trim(), avatar: newAvatar, role: newRole, pointsBalance: 0 });
    setNewName("");
    setNewAvatar("👦");
    setNewRole("member");
  };

  const handleSaveTask = () => {
    const cat = TASKS_CATALOG.find((c) => c.id === selectedTaskCatalog);
    if (cat) {
      addTask({
        title: cat.title,
        description: cat.description,
        points: cat.suggestedPoints,
        assignedTo: users.map((u) => u.id),
        createdBy: users.find((u) => u.role === "admin")?.id ?? "u1",
        isRecurring: false,
        isActive: true,
      });
    } else if (customTaskName.trim()) {
      addTask({
        title: customTaskName.trim(),
        points: parseInt(customTaskPts) || 20,
        assignedTo: users.map((u) => u.id),
        createdBy: users.find((u) => u.role === "admin")?.id ?? "u1",
        isRecurring: false,
        isActive: true,
      });
    }
    goNext();
  };

  const handleSaveReward = () => {
    const cat = REWARDS_CATALOG.find((c) => c.id === selectedRewardCatalog);
    if (cat) {
      addReward({
        title: cat.title,
        description: cat.description,
        emoji: cat.emoji,
        pointsCost: cat.suggestedPoints,
        status: "available",
      });
    } else if (customRewardName.trim()) {
      addReward({
        title: customRewardName.trim(),
        emoji: "🎁",
        pointsCost: parseInt(customRewardPts) || 200,
        status: "available",
      });
    }
    goNext();
  };

  const handleSaveLocation = () => {
    setLocation(country, region, region);
    goNext();
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        {step !== "welcome" && step !== "done" && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-7">
          {/* WELCOME */}
          {step === "welcome" && (
            <WelcomeStep onNext={goNext} t={t} />
          )}

          {/* MEMBERS */}
          {step === "members" && (
            <div className="space-y-5">
              <StepHeader icon={<Users className="w-5 h-5" />} title={t("stepMembers")} desc={t("stepMembersDesc")} />

              {/* Existing members */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">{t("currentMembers")}</p>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full text-sm">
                      <span>{u.avatar}</span>
                      <span className="font-medium">{u.name}</span>
                      {u.role === "admin" && <Badge className="text-[10px] h-4 px-1">Admin</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add new member */}
              <div className="border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold">{t("addMember")} <span className="text-muted-foreground font-normal text-xs">({t("optional")})</span></p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("memberName")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  />
                  <Select value={newRole} onValueChange={(v) => setNewRole((v ?? "member") as "admin" | "member")}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Miembro</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Avatar picker */}
                <div className="flex flex-wrap gap-1.5">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setNewAvatar(a)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-xl transition-all",
                        newAvatar === a ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddMember}
                  disabled={!newName.trim()}
                  className="w-full"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Añadir a la familia
                </Button>
              </div>

              <StepFooter onSkip={goNext} onNext={goNext} skipLabel={t("skipStep")} nextLabel={t("next")} />
            </div>
          )}

          {/* TASK */}
          {step === "task" && (
            <div className="space-y-5">
              <StepHeader icon={<CheckSquare className="w-5 h-5" />} title={t("stepTask")} desc={t("stepTaskDesc")} />

              {/* Catalog picks */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {TASKS_CATALOG.slice(0, 12).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedTaskCatalog(cat.id); setCustomTaskName(""); }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                      selectedTaskCatalog === cat.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-xs leading-tight">{cat.title}</span>
                    <span className="text-[10px] text-primary font-bold">{cat.suggestedPoints}p</span>
                  </button>
                ))}
              </div>

              {/* Custom */}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">O crea una personalizada:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la tarea"
                    value={customTaskName}
                    onChange={(e) => { setCustomTaskName(e.target.value); setSelectedTaskCatalog(null); }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Pts"
                    value={customTaskPts}
                    onChange={(e) => setCustomTaskPts(e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>

              <StepFooter
                onSkip={goNext}
                onNext={handleSaveTask}
                skipLabel={t("skipStep")}
                nextLabel={t("next")}
                nextDisabled={!selectedTaskCatalog && !customTaskName.trim()}
              />
            </div>
          )}

          {/* REWARD */}
          {step === "reward" && (
            <div className="space-y-5">
              <StepHeader icon={<Gift className="w-5 h-5" />} title={t("stepReward")} desc={t("stepRewardDesc")} />

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {REWARDS_CATALOG.slice(0, 12).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedRewardCatalog(cat.id); setCustomRewardName(""); }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                      selectedRewardCatalog === cat.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-xs leading-tight">{cat.title}</span>
                    <span className="text-[10px] text-primary font-bold">{cat.suggestedPoints}p</span>
                  </button>
                ))}
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">O crea una personalizada:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la recompensa"
                    value={customRewardName}
                    onChange={(e) => { setCustomRewardName(e.target.value); setSelectedRewardCatalog(null); }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Pts"
                    value={customRewardPts}
                    onChange={(e) => setCustomRewardPts(e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>

              <StepFooter
                onSkip={goNext}
                onNext={handleSaveReward}
                skipLabel={t("skipStep")}
                nextLabel={t("next")}
                nextDisabled={!selectedRewardCatalog && !customRewardName.trim()}
              />
            </div>
          )}

          {/* LOCATION */}
          {step === "location" && (
            <div className="space-y-5">
              <StepHeader icon={<MapPin className="w-5 h-5" />} title={t("stepLocation")} desc={t("stepLocationDesc")} />

              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1.5 block">{t("selectCountry")}</Label>
                  <Select value={country} onValueChange={(v) => setCountry(v ?? "ES")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {country === "ES" && (
                  <div>
                    <Label className="text-sm mb-1.5 block">{t("selectRegion")}</Label>
                    <Select value={region} onValueChange={(v) => setRegion(v ?? "ES-MD")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ES_REGIONS.map((r) => (
                          <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <StepFooter onSkip={goNext} onNext={handleSaveLocation} skipLabel={t("skipStep")} nextLabel={t("next")} />
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="text-center space-y-5 py-2">
              <div className="text-6xl">🎉</div>
              <div>
                <h2 className="text-2xl font-extrabold">{t("stepDone")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("stepDoneDesc")}</p>
              </div>

              {/* Summary */}
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-primary">{users.length}</p>
                  <p className="text-muted-foreground">miembros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-green-600">
                    <CheckSquare className="w-6 h-6 mx-auto" />
                  </p>
                  <p className="text-muted-foreground">tareas listas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-amber-500">
                    <Star className="w-6 h-6 mx-auto fill-amber-400 text-amber-400" />
                  </p>
                  <p className="text-muted-foreground">recompensas</p>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleFinish}>
                <PartyPopper className="w-4 h-4 mr-2" />
                {t("goToDashboard")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext, t }: { onNext: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center space-y-6 py-2">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl mx-auto">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold">{t("welcome")}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("welcomeDesc")}</p>
      </div>
      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Familia</span>
        <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4" /> Tareas</span>
        <span className="flex items-center gap-1.5"><Gift className="w-4 h-4" /> Recompensas</span>
      </div>
      <Button className="w-full" size="lg" onClick={onNext}>
        Empezar configuración
      </Button>
      <button className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
        Ya lo configuro después
      </button>
    </div>
  );
}

function StepHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function StepFooter({
  onSkip,
  onNext,
  skipLabel,
  nextLabel,
  nextDisabled,
}: {
  onSkip: () => void;
  onNext: () => void;
  skipLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {skipLabel}
      </button>
      <Button className="flex-1" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
