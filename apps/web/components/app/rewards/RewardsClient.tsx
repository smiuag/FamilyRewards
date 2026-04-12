"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAnnounce } from "@/components/AriaLiveAnnouncer";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyRewards, fetchFamilyClaims, createClaim, approveClaim } from "@/lib/api/rewards";
import type { RewardClaim } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { Star, Gift, Clock, CheckCircle2, XCircle, Heart, Archive, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

export default function RewardsClient() {
  const t = useTranslations("rewards");
  const announce = useAnnounce();
  const { currentUser, rewards, claims, addClaim, updateClaim, loadRewards, loadClaims, targetRewardIds, toggleTargetReward, archivedClaimIds, archiveClaim } = useAppStore();
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([fetchFamilyRewards(), fetchFamilyClaims()])
      .then(([r, c]) => { loadRewards(r); loadClaims(c); })
      .catch(() => {});
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const userClaims = claims.filter((c) => c.userId === currentUser.id);

  const getClaimForReward = (rewardId: string) =>
    userClaims.filter((c) => c.rewardId === rewardId).at(-1);

  const handleRedeem = async () => {
    if (!confirmReward) return;
    const isAdmin = currentUser.role === "admin";
    setRedeeming(true);
    try {
      const status = isAdmin ? "approved" : "pending";
      const claim = await createClaim(confirmReward.id, currentUser.id, status);
      addClaim(claim);
      // If admin auto-approves: also sync points deduction to Supabase
      if (isAdmin) {
        await approveClaim(claim.id, currentUser.id, confirmReward.pointsCost, currentUser.pointsBalance, confirmReward.title, confirmReward.emoji);
      }
      setConfirmReward(null);
      if (isAdmin) {
        toast.success(t("toastAdminRedeemed", { emoji: confirmReward.emoji, title: confirmReward.title }), {
          description: t("toastAdminRedeemedDesc"),
        });
        announce(t("toastAdminRedeemed", { emoji: confirmReward.emoji, title: confirmReward.title }));
      } else {
        toast.success(t("toastRequestSent"), {
          description: t("toastRequestSentDesc"),
        });
        announce(t("toastRequestSent"));
      }
    } catch {
      toast.error(t("toastRedeemError"));
    } finally {
      setRedeeming(false);
    }
  };

  const RewardCard = ({ reward }: { reward: Reward }) => {
    const canAfford = currentUser.pointsBalance >= reward.pointsCost;
    const claim = getClaimForReward(reward.id);
    const hasPendingClaim = claim?.status === "pending";
    const isApproved = claim?.status === "approved";
    const isRejected = claim?.status === "rejected";
    const isResolved = (isApproved || isRejected) && !!claim;
    const isArchived = isResolved && archivedClaimIds.includes(claim!.id);
    const isTarget = targetRewardIds.includes(reward.id);

    if (isArchived) return null;

    return (
      <Card
        className={cn(
          "border-2 shadow-sm transition-all hover:shadow-md relative",
          !canAfford && "opacity-75",
          isApproved
            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
            : isTarget
              ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
              : "border-border bg-card"
        )}
      >
        <CardContent className="pt-5">
          {/* Target toggle */}
          <button
            onClick={() => toggleTargetReward(reward.id)}
            className={cn(
              "absolute top-3 right-3 p-1.5 rounded-lg transition-all",
              isTarget
                ? "text-red-500"
                : "text-muted-foreground/30 hover:text-red-300"
            )}
            title={isTarget ? t("removeTarget") : t("setTarget")}
          >
            <Heart className={cn("w-5 h-5 transition-all", isTarget && "fill-red-500")} />
          </button>

          {/* Emoji */}
          <div className="text-5xl mb-3">{reward.emoji}</div>

          {/* Title & description */}
          <h3 className="font-bold text-foreground mb-1 pr-7">{reward.title}</h3>
          {reward.description && (
            <p className="text-xs text-muted-foreground mb-3">
              {reward.description}
            </p>
          )}

          {/* Cost */}
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="font-bold text-primary">
              {reward.pointsCost.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">pts</span>
            {canAfford && !hasPendingClaim && !isApproved && (
              <span className="ml-auto text-xs text-green-600 font-medium">{t("canAfford")}</span>
            )}
          </div>

          {/* Claim status or button */}
          {isApproved ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {t("status.approved")}
              </div>
              <button onClick={() => archiveClaim(claim!.id)}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title={t("archiveTitle")}>
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : hasPendingClaim ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
              <Clock className="w-4 h-4" />
              {t("status.pending")}
            </div>
          ) : isRejected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <XCircle className="w-4 h-4" />
                {t("status.rejected")}
              </div>
              <button onClick={() => archiveClaim(claim!.id)}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title={t("archiveTitle")}>
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              disabled={!canAfford || reward.status === "disabled"}
              onClick={() => setConfirmReward(reward)}
            >
              <Gift className="w-3.5 h-3.5 mr-1.5" />
              {canAfford ? t("redeem") : t("notEnoughPoints")}
            </Button>
          )}

          {!canAfford && !hasPendingClaim && !isApproved && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t("missingPoints", { points: (reward.pointsCost - currentUser.pointsBalance).toLocaleString() })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with points */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Star className="w-4 h-4 fill-primary" />
          <span className="font-bold text-lg">
            {currentUser.pointsBalance.toLocaleString()}
          </span>
          <span className="text-sm font-medium">{t("myPoints")}</span>
        </div>
      </div>

      {/* All rewards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </div>

      {/* Archived claims */}
      {(() => {
        const archived = userClaims
          .filter((c) => archivedClaimIds.includes(c.id) && (c.status === "approved" || c.status === "rejected"))
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
        if (archived.length === 0) return null;
        return (
          <div>
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <Archive className="w-4 h-4" />
              {t("archive")} ({archived.length})
              <ChevronDown className={cn("w-4 h-4 transition-transform", archiveOpen && "rotate-180")} />
            </button>
            {archiveOpen && (
              <div className="space-y-2">
                {archived.map((claim) => {
                  const reward = rewards.find((r) => r.id === claim.rewardId);
                  return (
                    <div key={claim.id} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5 text-sm">
                      <span className="text-xl">{reward?.emoji}</span>
                      <span className="flex-1 font-medium text-muted-foreground">{reward?.title}</span>
                      <span className={cn(
                        "text-xs font-semibold",
                        claim.status === "approved" ? "text-green-600" : "text-red-500"
                      )}>
                        {claim.status === "approved" ? t("approvedLabel") : t("rejectedLabel")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(claim.requestedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Confirm modal */}
      <AppModal open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <AppModalHeader
          emoji={confirmReward?.emoji}
          title={t("confirmTitle")}
          description={confirmReward?.title}
          color="bg-gradient-to-br from-amber-400 to-orange-500"
          onClose={() => setConfirmReward(null)}
        />
        <AppModalBody>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("confirmBody", { points: confirmReward?.pointsCost.toLocaleString() ?? "" })}
          </p>
          <div className="flex items-center justify-between bg-muted rounded-xl p-3">
            <span className="text-sm text-muted-foreground">{t("currentBalance")}</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              {currentUser?.pointsBalance.toLocaleString()} pts
            </span>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfirmReward(null)} disabled={redeeming}>{t("cancelButton")}</Button>
          <Button onClick={handleRedeem} disabled={redeeming}>
            <Gift className="w-4 h-4 mr-1.5" />
            {redeeming ? t("processing") : t("confirmRequest")}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
