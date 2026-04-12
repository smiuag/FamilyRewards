"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePollStore } from "@/lib/store/usePollStore";
import {
  fetchActivePoll,
  fetchPollVotes,
  castVote,
  getVoteCounts,
} from "@/lib/api/polls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Clock, Check } from "lucide-react";
import { toast } from "sonner";

export function PollBanner() {
  const t = useTranslations("polls");
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const router = useRouter();
  const { currentUser, users } = useAppStore();
  const {
    activePoll, votes,
    loadActivePoll, loadVotes,
    castVoteLocal,
  } = usePollStore();

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const poll = await fetchActivePoll();
        loadActivePoll(poll);
        if (poll) {
          const v = await fetchPollVotes(poll.id);
          loadVotes(v);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadActivePoll, loadVotes]);

  if (loading || !activePoll || !currentUser) return null;

  const now = new Date();
  const expires = new Date(activePoll.expiresAt);
  const isExpired = now >= expires;

  const myVote = votes.find(
    (v) => v.pollId === activePoll.id && v.profileId === currentUser.id
  );

  const counts = getVoteCounts(votes, activePoll.options);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  const diffMs = Math.max(0, expires.getTime() - now.getTime());
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);
  const timeLeft =
    diffDays > 0 ? `${diffDays}d ${diffHours % 24}h`
    : diffHours > 0 ? `${diffHours}h`
    : isExpired ? t("expired")
    : "<1h";

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

  return (
    <Card className="shadow-sm border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Vote className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {activePoll.title}
          </CardTitle>
          <button
            onClick={() => router.push(`/${locale}/polls`)}
            className="text-xs text-primary hover:underline"
          >
            {t("title")}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Compact voting options */}
        {activePoll.options.map((opt) => {
          const count = counts[opt.key] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote?.optionKey === opt.key;
          const label = locale === "en" ? opt.labelEn : opt.label;

          return (
            <button
              key={opt.key}
              onClick={() => handleVote(opt.key)}
              disabled={voting || isExpired}
              className={`w-full relative rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all overflow-hidden ${
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
                  {isMyVote && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{pct}% ({count})</span>
              </div>
            </button>
          );
        })}

        {/* Footer line */}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>{t("totalVotes", { count: totalVotes })}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isExpired ? t("expired") : timeLeft}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
