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
  ArrowRight,
  Star,
} from "lucide-react";

type Step = "welcome" | "task" | "reward" | "members" | "location" | "done";
const STEPS: Step[] = ["welcome", "task", "reward", "members", "location", "done"];

const CUSTOM_ID = "__custom__";

const AVATARS = ["👦","👧","👨","👩","👴","👵","🧒","🧑","👱","🦊","🐱","🐶"];


export default function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const { currentUser, users, addMember, addTask, addReward, completeOnboarding } = useAppStore();
  const { setPostalCode } = useSettingsStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const [step, setStep] = useState<Step>("welcome");

  // Task step
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [customTaskName, setCustomTaskName] = useState("");
  const [customTaskPts, setCustomTaskPts] = useState("20");

  // Reward step
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [customRewardName, setCustomRewardName] = useState("");
  const [customRewardPts, setCustomRewardPts] = useState("200");

  // Members step
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("👦");
  const [newRole, setNewRole] = useState<"admin" | "member">("member");

  // Location step
  const [postalCode, setPostalCodeInput] = useState("");

  const currentIndex = STEPS.indexOf(step);
  const progress = (currentIndex / (STEPS.length - 1)) * 100;

  const goNext = () => {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleSaveTask = () => {
    if (selectedTaskId === CUSTOM_ID && customTaskName.trim()) {
      addTask({
        title: customTaskName.trim(),
        points: parseInt(customTaskPts) || 20,
        assignedTo: currentUser ? [currentUser.id] : [],
        createdBy: currentUser?.id ?? "",
        isRecurring: false,
        isActive: true,
      });
    } else {
      const cat = TASKS_CATALOG.find((c) => c.id === selectedTaskId);
      if (cat) {
        addTask({
          title: cat.title,
          description: cat.description,
          points: cat.suggestedPoints,
          assignedTo: currentUser ? [currentUser.id] : [],
          createdBy: currentUser?.id ?? "",
          isRecurring: false,
          isActive: true,
        });
      }
    }
    goNext();
  };

  const handleSaveReward = () => {
    if (selectedRewardId === CUSTOM_ID && customRewardName.trim()) {
      addReward({
        title: customRewardName.trim(),
        emoji: "🎁",
        pointsCost: parseInt(customRewardPts) || 200,
        status: "available",
      });
    } else {
      const cat = REWARDS_CATALOG.find((c) => c.id === selectedRewardId);
      if (cat) {
        addReward({
          title: cat.title,
          description: cat.description,
          emoji: cat.emoji,
          pointsCost: cat.suggestedPoints,
          status: "available",
        });
      }
    }
    goNext();
  };

  const handleAddMember = () => {
    if (!newName.trim()) return;
    addMember({ name: newName.trim(), avatar: newAvatar, role: newRole, pointsBalance: 0 });
    setNewName("");
    setNewAvatar("👦");
    setNewRole("member");
  };

  const handleSaveLocation = () => {
    if (postalCode.trim()) setPostalCode(postalCode.trim());
    goNext();
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push(`/${locale}/admin/members`);
  };

  const taskNextDisabled =
    !selectedTaskId || (selectedTaskId === CUSTOM_ID && !customTaskName.trim());
  const rewardNextDisabled =
    !selectedRewardId || (selectedRewardId === CUSTOM_ID && !customRewardName.trim());

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        {step !== "welcome" && step !== "done" && (
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="p-7">

          {/* WELCOME */}
          {step === "welcome" && (
            <div className="text-center space-y-6 py-2">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl mx-auto">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{t("welcome")}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t("welcomeDesc")}</p>
              </div>
              <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4 text-primary" /> Tarea para ti</span>
                <span className="flex items-center gap-1.5"><Gift className="w-4 h-4 text-primary" /> Recompensa</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Familia</span>
              </div>
              <Button className="w-full" size="lg" onClick={goNext}>
                Empezar configuración
              </Button>
            </div>
          )}

          {/* TASK */}
          {step === "task" && (
            <div className="space-y-4">
              <StepHeader
                icon={<CheckSquare className="w-5 h-5" />}
                title={t("stepTaskForYou")}
                desc={t("stepTaskForYouDesc")}
                who={currentUser ? `${currentUser.avatar} ${currentUser.name}` : undefined}
              />

              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {TASKS_CATALOG.slice(0, 11).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTaskId(cat.id)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                      selectedTaskId === cat.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-xs leading-tight">{cat.title}</span>
                    <span className="text-[10px] text-primary font-bold">{cat.suggestedPoints}p</span>
                  </button>
                ))}
                {/* Custom option */}
                <button
                  onClick={() => setSelectedTaskId(CUSTOM_ID)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                    selectedTaskId === CUSTOM_ID
                      ? "border-primary bg-primary/5 font-semibold"
                      : "border-dashed border-muted-foreground/40 hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span className="text-lg">✏️</span>
                  <span className="flex-1 text-xs leading-tight">{t("customTask")}</span>
                </button>
              </div>

              {selectedTaskId === CUSTOM_ID && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la tarea"
                    value={customTaskName}
                    onChange={(e) => setCustomTaskName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Input
                    type="number"
                    placeholder="Pts"
                    value={customTaskPts}
                    onChange={(e) => setCustomTaskPts(e.target.value)}
                    className="w-20"
                  />
                </div>
              )}

              <StepFooter
                onSkip={goNext}
                onNext={handleSaveTask}
                skipLabel={t("skipStep")}
                nextLabel={t("next")}
                nextDisabled={taskNextDisabled}
              />
            </div>
          )}

          {/* REWARD */}
          {step === "reward" && (
            <div className="space-y-4">
              <StepHeader
                icon={<Gift className="w-5 h-5" />}
                title={t("stepRewardForYou")}
                desc={t("stepRewardForYouDesc")}
              />

              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {REWARDS_CATALOG.slice(0, 11).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedRewardId(cat.id)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                      selectedRewardId === cat.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-xs leading-tight">{cat.title}</span>
                    <span className="text-[10px] text-primary font-bold">{cat.suggestedPoints}p</span>
                  </button>
                ))}
                {/* Custom option */}
                <button
                  onClick={() => setSelectedRewardId(CUSTOM_ID)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all",
                    selectedRewardId === CUSTOM_ID
                      ? "border-primary bg-primary/5 font-semibold"
                      : "border-dashed border-muted-foreground/40 hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span className="text-lg">✏️</span>
                  <span className="flex-1 text-xs leading-tight">{t("customReward")}</span>
                </button>
              </div>

              {selectedRewardId === CUSTOM_ID && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la recompensa"
                    value={customRewardName}
                    onChange={(e) => setCustomRewardName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Input
                    type="number"
                    placeholder="Pts"
                    value={customRewardPts}
                    onChange={(e) => setCustomRewardPts(e.target.value)}
                    className="w-20"
                  />
                </div>
              )}

              <StepFooter
                onSkip={goNext}
                onNext={handleSaveReward}
                skipLabel={t("skipStep")}
                nextLabel={t("next")}
                nextDisabled={rewardNextDisabled}
              />
            </div>
          )}

          {/* MEMBERS */}
          {step === "members" && (
            <div className="space-y-4">
              <StepHeader
                icon={<Users className="w-5 h-5" />}
                title={t("stepMembersAfter")}
                desc={t("stepMembersAfterDesc")}
              />

              {/* Existing members */}
              {users.length > 0 && (
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
              )}

              {/* Add member */}
              <div className="border rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold">
                  {t("addMember")}{" "}
                  <span className="text-muted-foreground font-normal text-xs">({t("optional")})</span>
                </p>
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
                <Button size="sm" variant="outline" onClick={handleAddMember} disabled={!newName.trim()} className="w-full">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Añadir a la familia
                </Button>
              </div>

              <StepFooter onSkip={goNext} onNext={goNext} skipLabel={t("skipStep")} nextLabel={t("next")} />
            </div>
          )}

          {/* LOCATION */}
          {step === "location" && (
            <div className="space-y-5">
              <StepHeader icon={<MapPin className="w-5 h-5" />} title={t("stepLocation")} desc={t("stepLocationDesc")} />
              <div>
                <Label className="text-sm mb-1.5 block">Código postal</Label>
                <Input
                  placeholder="28001"
                  value={postalCode}
                  onChange={(e) => setPostalCodeInput(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Lo usaremos para calcular los festivos locales de tu zona.
                </p>
              </div>
              <StepFooter onSkip={goNext} onNext={handleSaveLocation} skipLabel={t("skipStep")} nextLabel={t("next")} />
            </div>
          )}

          {/* DONE */}
          {step === "done" && (
            <div className="space-y-5 py-1">
              <div className="text-center space-y-2">
                <div className="text-5xl">🎉</div>
                <h2 className="text-2xl font-extrabold">{t("stepDone")}</h2>
                <p className="text-muted-foreground text-sm">{t("stepDoneDesc")}</p>
              </div>

              {/* Next steps */}
              <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Próximos pasos sugeridos</p>
                {[
                  { icon: "👨‍👩‍👧", text: "Añade al resto de tu familia desde Administración → Miembros" },
                  { icon: "✉️", text: "Dale permisos de administrador a quien desees desde Administración → Miembros" },
                  { icon: "📋", text: "Crea más tareas y asígnalas a quien quieras" },
                  { icon: "🎁", text: "Explora el catálogo completo de recompensas" },
                  { icon: "📅", text: "Configura festivos locales en Configuración" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-muted-foreground leading-snug">{item.text}</span>
                  </div>
                ))}
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

function StepHeader({
  icon, title, desc, who,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  who?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
        {who && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-primary" />
            {who}
          </span>
        )}
      </div>
    </div>
  );
}

function StepFooter({
  onSkip, onNext, skipLabel, nextLabel, nextDisabled,
}: {
  onSkip: () => void;
  onNext: () => void;
  skipLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        {skipLabel}
      </button>
      <Button className="flex-1" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
}
