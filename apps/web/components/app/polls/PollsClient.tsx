"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePollStore } from "@/lib/store/usePollStore";
import {
  fetchFamilyPolls,
  fetchActivePoll,
  fetchPollVotes,
  createPoll,
  castVote,
  closePoll,
  cancelPoll,
  extendPoll,
  getVoteCounts,
  applySystemAction,
} from "@/lib/api/polls";
import type { PollOption, PollVote, FamilyPoll } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Plus, Check, X, Clock, PawPrint, History } from "lucide-react";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { toast } from "sonner";

export default function PollsClient() {
  const t = useTranslations("polls");
  const tc = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, users, featuresUnlocked } = useAppStore();
  const {
    activePoll, polls, votes,
    loadActivePoll, loadPolls, loadVotes,
    addPoll, castVoteLocal, closePollLocal, cancelPollLocal,
  } = usePollStore();

  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [voting, setVoting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"close" | "cancel" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [active, all] = await Promise.all([
          fetchActivePoll(),
          fetchFamilyPolls(),
        ]);
        loadActivePoll(active);
        loadPolls(all);
        if (active) {
          const v = await fetchPollVotes(active.id);
          loadVotes(v);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadActivePoll, loadPolls, loadVotes]);

  const isAdmin = currentUser?.role === "admin";

  async function handleVote(optionKey: string) {
    if (!currentUser || !activePoll || voting) return;
    setVoting(true);
    try {
      const vote = await castVote(activePoll.id, currentUser.id, optionKey);
      castVoteLocal(vote);
    } catch {
      toast.error("Error");
    } finally {
      setVoting(false);
    }
  }

  async function handleCloseConfirmed() {
    if (!activePoll) return;
    setConfirmAction(null);
    try {
      const pollVotes = await fetchPollVotes(activePoll.id);
      const winnerKey = await closePoll(activePoll.id, pollVotes, activePoll.options);
      closePollLocal(activePoll.id, winnerKey);
      if (activePoll.type === "system" && activePoll.systemAction && winnerKey === "yes") {
        applySystemAction(activePoll.systemAction);
        toast.success(t("featureActivated"));
      }
      const all = await fetchFamilyPolls();
      loadPolls(all);
      loadActivePoll(null);
    } catch {
      toast.error("Error");
    }
  }

  async function handleCancelConfirmed() {
    if (!activePoll) return;
    setConfirmAction(null);
    try {
      await cancelPoll(activePoll.id);
      cancelPollLocal(activePoll.id);
      const all = await fetchFamilyPolls();
      loadPolls(all);
      loadActivePoll(null);
    } catch {
      toast.error("Error");
    }
  }

  async function handleExtend(hours: number) {
    if (!activePoll) return;
    try {
      const newExpiry = await extendPoll(activePoll.id, hours * 3600000);
      loadActivePoll({ ...activePoll, expiresAt: newExpiry });
      toast.success(t("extended"));
    } catch {
      toast.error("Error");
    }
  }

  // Quick action: propose pet vote
  async function handleProposePet() {
    if (!currentUser) return;
    const poll = await createPoll({
      familyId: currentUser.familyId,
      title: t("petProposalTitle"),
      description: t("petProposalDesc"),
      type: "system",
      systemAction: "enable_pets",
      visibility: "public",
      options: [
        { key: "yes", label: t("yes"), labelEn: "Yes" },
        { key: "no", label: t("no"), labelEn: "No" },
      ],
      createdBy: currentUser.id,
      expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    });
    addPoll(poll);
    loadActivePoll(poll);
    loadVotes([]);
    toast.success(t("activePoll"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const closedPolls = polls.filter((p) => p.status !== "active");
  const showPetSuggestion = isAdmin && !activePoll && !featuresUnlocked.includes("pets");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vote className="w-6 h-6 text-indigo-600" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => {
          if (activePoll) {
            toast.error(t("alreadyActive"));
            return;
          }
          setShowCreate(true);
        }}>
          <Plus className="w-4 h-4 mr-1" />
          {t("createPoll")}
        </Button>
      </div>

      {/* Pet suggestion CTA */}
      {showPetSuggestion && (
        <button
          onClick={handleProposePet}
          className="w-full rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 flex items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
        >
          <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <PawPrint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("suggestPetVote")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("petProposalDesc")}</p>
          </div>
        </button>
      )}

      {/* Active poll */}
      {activePoll && (
        <ActivePollCard
          poll={activePoll}
          votes={votes}
          currentUserId={currentUser?.id ?? ""}
          users={users}
          locale={locale}
          isAdmin={isAdmin}
          voting={voting}
          onVote={handleVote}
          onClose={() => setConfirmAction("close")}
          onCancel={() => setConfirmAction("cancel")}
          onExtend={handleExtend}
          t={t}
        />
      )}

      {/* No polls state */}
      {!activePoll && closedPolls.length === 0 && !showPetSuggestion && (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Vote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium">{t("noPollsYet")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("noPollsDesc")}</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {closedPolls.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <History className="w-4 h-4" />
            {t("history")}
          </h2>
          <div className="space-y-3">
            {closedPolls.map((poll) => (
              <ClosedPollCard key={poll.id} poll={poll} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        open={showCreate}
        onOpenChange={setShowCreate}
        locale={locale}
        t={t}
        tc={tc}
        isAdmin={isAdmin}
        currentUser={currentUser}
        featuresUnlocked={featuresUnlocked}
        onCreated={(poll) => {
          addPoll(poll);
          loadActivePoll(poll);
          loadVotes([]);
          setShowCreate(false);
        }}
      />

      {/* Confirm close/cancel modal */}
      <AppModal open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AppModalHeader
          emoji={confirmAction === "close" ? "🗳️" : "⚠️"}
          title={confirmAction === "close" ? t("closePoll") : t("cancelPoll")}
          color={confirmAction === "close" ? "bg-indigo-600" : "bg-destructive"}
          onClose={() => setConfirmAction(null)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            {confirmAction === "close" ? t("closeConfirm") : t("cancelConfirm")}
          </p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfirmAction(null)}>
            {tc("cancel")}
          </Button>
          <Button
            onClick={confirmAction === "close" ? handleCloseConfirmed : handleCancelConfirmed}
            className={confirmAction === "close" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-destructive hover:bg-destructive/90"}
          >
            {tc("confirm")}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}

// ── Active Poll Card ───────────────────────────────────────

function ActivePollCard({
  poll, votes, currentUserId, users, locale, isAdmin, voting,
  onVote, onClose, onCancel, onExtend, t,
}: {
  poll: FamilyPoll;
  votes: PollVote[];
  currentUserId: string;
  users: { id: string; name: string; avatar: string }[];
  locale: string;
  isAdmin: boolean;
  voting: boolean;
  onVote: (key: string) => void;
  onClose: () => void;
  onCancel: () => void;
  onExtend: (hours: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const now = new Date();
  const expires = new Date(poll.expiresAt);
  const isExpired = now >= expires;
  const myVote = votes.find((v) => v.pollId === poll.id && v.profileId === currentUserId);
  const counts = getVoteCounts(votes, poll.options);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  const diffMs = Math.max(0, expires.getTime() - now.getTime());
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);
  const timeLeft = diffDays > 0 ? `${diffDays}d ${diffHours % 24}h` : diffHours > 0 ? `${diffHours}h` : isExpired ? t("expired") : "<1h";

  return (
    <Card className="shadow-sm border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Vote className="w-4 h-4 text-indigo-600" />
            {poll.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {isExpired ? t("expired") : t("expiresIn", { time: timeLeft })}
          </div>
        </div>
        {poll.description && (
          <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((opt) => {
          const count = counts[opt.key] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote?.optionKey === opt.key;
          const label = locale === "en" ? opt.labelEn : opt.label;

          return (
            <button
              key={opt.key}
              onClick={() => onVote(opt.key)}
              disabled={voting || isExpired}
              className={`w-full relative rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all overflow-hidden ${
                isMyVote
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                  : "border-input hover:border-indigo-300"
              } ${isExpired ? "opacity-60 cursor-default" : ""}`}
            >
              {totalVotes > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-indigo-100/40 dark:bg-indigo-900/20 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMyVote && <Check className="w-4 h-4 text-indigo-600" />}
                  <span>{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{pct}% ({count})</span>
              </div>
              {poll.visibility === "public" && count > 0 && (
                <div className="relative mt-1.5 flex flex-wrap gap-1">
                  {votes
                    .filter((v) => v.pollId === poll.id && v.optionKey === opt.key)
                    .map((v) => {
                      const user = users.find((u) => u.id === v.profileId);
                      return (
                        <span key={v.id} className="inline-flex items-center gap-0.5 text-[10px] bg-muted/60 rounded px-1 py-0.5">
                          {user?.avatar} {user?.name}
                        </span>
                      );
                    })}
                </div>
              )}
            </button>
          );
        })}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {t("totalVotes", { count: totalVotes })}
            {poll.visibility === "private" && <span className="ml-2 opacity-60">🔒</span>}
          </p>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="outline" onClick={() => onExtend(24)} className="text-xs h-7">
              {t("extendPoll")} +24h
            </Button>
            <Button size="sm" variant="outline" onClick={() => onExtend(48)} className="text-xs h-7">
              {t("extendPoll")} +48h
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={onCancel} className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10">
              <X className="w-3 h-3 mr-1" /> {t("cancelPoll")}
            </Button>
            <Button size="sm" onClick={onClose} className="text-xs h-7 bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-3 h-3 mr-1" /> {t("closePoll")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Closed Poll Card ───────────────────────────────────────

function ClosedPollCard({
  poll, locale, t,
}: {
  poll: FamilyPoll;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const winnerOpt = poll.result ? poll.options.find((o) => o.key === poll.result) : null;
  const winnerLabel = winnerOpt
    ? (locale === "en" ? winnerOpt.labelEn : winnerOpt.label)
    : (poll.status === "closed" ? t("tieResult") : null);

  return (
    <Card className="shadow-sm opacity-80">
      <CardContent className="py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{poll.title}</p>
          {poll.status === "closed" && (
            <p className="text-xs text-muted-foreground">
              {winnerOpt
                ? <>{t("winner")}: <span className="font-semibold text-foreground">{winnerLabel}</span></>
                : <span className="text-amber-600">{winnerLabel}</span>
              }
            </p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {poll.status === "closed" ? t("closed") : t("cancelled")}
        </Badge>
      </CardContent>
    </Card>
  );
}

// ── Create Poll Modal ──────────────────────────────────────

function CreatePollModal({
  open, onOpenChange, locale, t, tc, isAdmin, currentUser, featuresUnlocked, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
  isAdmin: boolean;
  currentUser: { id: string; familyId: string; role: string } | null;
  featuresUnlocked: string[];
  onCreated: (poll: FamilyPoll) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"standard" | "system">("standard");
  const [systemAction, setSystemAction] = useState("enable_pets");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [duration, setDuration] = useState("48h");
  const [options, setOptions] = useState<{ label: string; labelEn: string }[]>([
    { label: "Opción 1", labelEn: "Option 1" },
    { label: "Opción 2", labelEn: "Option 2" },
  ]);
  const [creating, setCreating] = useState(false);

  // All possible system actions — filter out already-unlocked features
  const ALL_SYSTEM_ACTIONS: { key: string; label: string; featureFlag: string }[] = [
    { key: "enable_pets", label: t("actionEnablePets"), featureFlag: "pets" },
  ];
  const availableSystemActions = ALL_SYSTEM_ACTIONS.filter(
    (a) => !featuresUnlocked.includes(a.featureFlag)
  );
  const hasSystemActions = isAdmin && availableSystemActions.length > 0;

  // System action presets
  const SYSTEM_PRESETS: Record<string, { title: string; desc: string }> = {
    enable_pets: {
      title: t("petProposalTitle"),
      desc: t("petProposalDesc"),
    },
  };

  // Auto-fill when type changes to system or systemAction changes
  useEffect(() => {
    if (type === "system") {
      const preset = SYSTEM_PRESETS[systemAction];
      if (preset) {
        setTitle(preset.title);
        setDescription(preset.desc);
      }
      setOptions([
        { label: "Sí", labelEn: "Yes" },
        { label: "No", labelEn: "No" },
      ]);
    }
  }, [type, systemAction]);

  const durationMs: Record<string, number> = {
    "24h": 24 * 3600000,
    "48h": 48 * 3600000,
    "72h": 72 * 3600000,
    "1w": 7 * 24 * 3600000,
  };

  async function handleCreate() {
    if (!currentUser || !title.trim() || options.length < 2) return;
    setCreating(true);
    try {
      const poll = await createPoll({
        familyId: currentUser.familyId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        systemAction: type === "system" ? systemAction : undefined,
        visibility,
        options: options.map((o, i) => ({
          key: type === "system" ? (i === 0 ? "yes" : "no") : `opt_${i}`,
          label: o.label,
          labelEn: o.labelEn,
        })),
        createdBy: currentUser.id,
        expiresAt: new Date(Date.now() + (durationMs[duration] ?? durationMs["48h"])).toISOString(),
      });
      onCreated(poll);
      // Reset form
      setTitle("");
      setDescription("");
      setType("standard");
      setOptions([
        { label: "Opción 1", labelEn: "Option 1" },
        { label: "Opción 2", labelEn: "Option 2" },
      ]);
    } catch {
      toast.error("Error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalHeader
        emoji="🗳️"
        title={t("createPoll")}
        color="bg-indigo-600"
        onClose={() => onOpenChange(false)}
      />
      <AppModalBody>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">{t("pollTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("pollTitlePlaceholder")}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">{t("pollDescription")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("pollDescPlaceholder")}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
              rows={2}
              maxLength={300}
            />
          </div>

          {/* Type (admin only, only if system actions available) */}
          {hasSystemActions && (
            <div>
              <label className="text-sm font-medium">{t("pollType")}</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setType("standard")}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${type === "standard" ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" : "border-input"}`}
                >
                  {t("typeStandard")}
                </button>
                <button
                  onClick={() => setType("system")}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${type === "system" ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" : "border-input"}`}
                >
                  {t("typeSystem")}
                </button>
              </div>
            </div>
          )}

          {/* System action */}
          {type === "system" && hasSystemActions && (
            <div>
              <label className="text-sm font-medium">{t("systemAction")}</label>
              <select
                value={systemAction}
                onChange={(e) => setSystemAction(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {availableSystemActions.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="text-sm font-medium">{t("visibility")}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setVisibility("public")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${visibility === "public" ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" : "border-input"}`}
              >
                👁️ {t("visibilityPublic")}
              </button>
              <button
                onClick={() => setVisibility("private")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${visibility === "private" ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" : "border-input"}`}
              >
                🔒 {t("visibilityPrivate")}
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium">{t("duration")}</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {(["24h", "48h", "72h", "1w"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium ${duration === d ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30" : "border-input"}`}
                >
                  {t(`duration${d.replace("h", "h").replace("w", "w")}` as "duration24h")}
                </button>
              ))}
            </div>
          </div>

          {/* Options (only for standard) */}
          {type === "standard" && (
            <div>
              <label className="text-sm font-medium">{t("options")}</label>
              <div className="space-y-2 mt-1">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => {
                        const copy = [...options];
                        copy[i] = { ...copy[i], label: e.target.value, labelEn: e.target.value };
                        setOptions(copy);
                      }}
                      placeholder={t("optionPlaceholder", { n: i + 1 })}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      maxLength={60}
                    />
                    {options.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOptions(options.filter((_, j) => j !== i))}
                        className="text-xs"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOptions([...options, { label: "", labelEn: "" }])}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> {t("addOption")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </AppModalBody>
      <AppModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {tc("cancel")}
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!title.trim() || options.length < 2 || creating}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {t("createPoll")}
        </Button>
      </AppModalFooter>
    </AppModal>
  );
}
