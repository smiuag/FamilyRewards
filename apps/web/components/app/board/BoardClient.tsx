"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  fetchBoardMessages,
  postBoardMessage,
  fetchReactions,
  toggleReaction,
  togglePinMessage,
  deleteBoardMessage,
} from "@/lib/api/board";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import type { BoardMessage, Reaction } from "@/lib/api/board";
import type { PointsTransaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pin,
  PinOff,
  Send,
  Megaphone,
  Trophy,
  Gift,
  MessageCircle,
  Star,
  TrendingUp,
  TrendingDown,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Unión de mensajes del tablón + transacciones para el feed
interface FeedItem {
  id: string;
  type: "board" | "transaction";
  createdAt: string;
  data: BoardMessage | PointsTransaction;
}

const MSG_TYPE_CONFIG = {
  message:      { icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   labelKey: "typeMessage" as const },
  achievement:  { icon: Trophy,        color: "text-yellow-500", bg: "bg-yellow-50", labelKey: "typeAchievement" as const },
  reward:       { icon: Gift,          color: "text-purple-500", bg: "bg-purple-50", labelKey: "typeReward" as const },
  announcement: { icon: Megaphone,     color: "text-primary",    bg: "bg-orange-50", labelKey: "typeAnnouncement" as const },
  points:       { icon: Star,          color: "text-primary",    bg: "bg-orange-50", labelKey: "typePoints" as const },
};

export default function BoardClient() {
  const t = useTranslations("board");
  const { currentUser, users } = useAppStore();
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [msgs, txs] = await Promise.all([
        fetchBoardMessages(100),
        fetchFamilyTransactions(),
      ]);
      setMessages(msgs);
      setTransactions(txs);
      // Fetch reactions for all messages
      if (msgs.length > 0) {
        const rxns = await fetchReactions(msgs.map((m) => m.id));
        setReactions(rxns);
      }
    } catch (err) {
      console.error("Error loading board data:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!currentUser) return null;

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !currentUser.familyId) return;
    setSending(true);
    try {
      const msg = await postBoardMessage({
        familyId: currentUser.familyId,
        profileId: currentUser.id,
        content: text,
      });
      setMessages((prev) => [msg, ...prev]);
      setNewMessage("");
    } catch (err) {
      console.error("Error posting message:", err);
    }
    setSending(false);
  };

  // Combinar mensajes + transacciones en un feed único, ordenado por fecha
  const feed: FeedItem[] = [
    ...messages.map((m) => ({
      id: m.id,
      type: "board" as const,
      createdAt: m.createdAt,
      data: m,
    })),
    ...transactions.map((t) => ({
      id: t.id,
      type: "transaction" as const,
      createdAt: t.createdAt,
      data: t,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    // Optimistic update
    const existing = reactions.find(
      (r) => r.messageId === messageId && r.profileId === currentUser.id && r.emoji === emoji
    );
    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const optimistic: Reaction = {
        id: `temp-${Date.now()}`,
        messageId,
        profileId: currentUser.id,
        emoji,
        createdAt: new Date().toISOString(),
      };
      setReactions((prev) => [...prev, optimistic]);
    }
    try {
      await toggleReaction({ messageId, profileId: currentUser.id, emoji });
      // Refetch reactions for consistency
      const rxns = await fetchReactions(messages.map((m) => m.id));
      setReactions(rxns);
    } catch (err) {
      console.error("Error toggling reaction:", err);
      // Revert on error
      const rxns = await fetchReactions(messages.map((m) => m.id));
      setReactions(rxns);
    }
  };

  const isAdmin = currentUser.role === "admin";

  const handlePin = async (messageId: string, pinned: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned } : m))
    );
    try {
      await togglePinMessage(messageId, pinned);
      toast.success(pinned ? t("pinSuccess") : t("unpinSuccess"));
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, pinned: !pinned } : m))
      );
      toast.error(t("pinError"));
    }
  };

  const handleDelete = async (messageId: string) => {
    const removed = messages.find((m) => m.id === messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteBoardMessage(messageId);
      toast.success(t("deleteSuccess"));
    } catch {
      if (removed) setMessages((prev) => [...prev, removed].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      toast.error(t("deleteError"));
    }
  };

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

      {/* Compose */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={t("placeholder", { name: currentUser.name })}
                aria-label={t("placeholder", { name: currentUser.name })}
                className="w-full text-sm resize-none bg-muted/50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sending ? t("sending") : t("send")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Pin className="w-3 h-3" /> {t("pinned")}
          </div>
          {pinnedMessages.map((msg) => (
            <BoardMessageCard
              key={msg.id}
              msg={msg}
              users={users}
              reactions={reactions.filter((r) => r.messageId === msg.id)}
              currentProfileId={currentUser.id}
              isAdmin={isAdmin}
              onToggleReaction={handleToggleReaction}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Feed */}
      {!loading && (
        <div className="space-y-3">
          {feed.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-10 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("emptyTitle")}</p>
                <p className="text-sm mt-1">{t("emptyHint")}</p>
              </CardContent>
            </Card>
          )}
          {feed.map((item) =>
            item.type === "board" ? (
              <BoardMessageCard
                key={item.id}
                msg={item.data as BoardMessage}
                users={users}
                reactions={reactions.filter((r) => r.messageId === item.id)}
                currentProfileId={currentUser.id}
                isAdmin={isAdmin}
                onToggleReaction={handleToggleReaction}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            ) : (
              <TransactionCard
                key={item.id}
                tx={item.data as PointsTransaction}
                users={users}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🔥"];

function BoardMessageCard({
  msg,
  users,
  reactions,
  currentProfileId,
  isAdmin,
  onToggleReaction,
  onPin,
  onDelete,
}: {
  msg: BoardMessage;
  users: ReturnType<typeof useAppStore.getState>["users"];
  reactions: Reaction[];
  currentProfileId: string;
  isAdmin: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onPin: (messageId: string, pinned: boolean) => void;
  onDelete: (messageId: string) => void;
}) {
  const t = useTranslations("board");
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const author = users.find((u) => u.id === msg.profileId);
  const isSystem = !msg.profileId;
  const typeConfig = MSG_TYPE_CONFIG[msg.type] ?? MSG_TYPE_CONFIG.message;
  const TypeIcon = typeConfig.icon;

  // Group reactions by emoji: { "👍": { count, profileIds } }
  const grouped = reactions.reduce<Record<string, { count: number; profileIds: string[] }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, profileIds: [] };
      acc[r.emoji].count++;
      acc[r.emoji].profileIds.push(r.profileId);
      return acc;
    },
    {}
  );

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  return (
    <Card
      className={cn(
        "shadow-sm transition-all",
        msg.pinned && "border-primary/30 bg-primary/5",
        isSystem && cn("border-0", typeConfig.bg)
      )}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              isSystem ? cn("text-lg", typeConfig.bg) : "bg-orange-100 text-xl"
            )}
          >
            {isSystem ? <TypeIcon className={cn("w-4 h-4", typeConfig.color)} /> : author?.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold">
                {isSystem ? t("systemAuthor") : author?.name ?? t("unknownUser")}
              </span>
              <Badge variant="outline" className={cn("text-[10px] border-0", typeConfig.bg, typeConfig.color)}>
                {t(typeConfig.labelKey)}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
              </span>
              {/* Admin actions */}
              {isAdmin && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={() => onPin(msg.id, !msg.pinned)}
                    aria-label={msg.pinned ? t("unpin") : t("pin")}
                    title={msg.pinned ? t("unpin") : t("pin")}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {msg.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      aria-label={t("delete")}
                      title={t("delete")}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { onDelete(msg.id); setConfirmDelete(false); }}
                      onBlur={() => setConfirmDelete(false)}
                      aria-label={t("confirmDelete")}
                      className="inline-flex items-center gap-1 px-2 h-6 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("confirmDelete")}
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
            {msg.pinned && (
              <div className="flex items-center gap-1 text-xs text-primary mt-2">
                <Pin className="w-3 h-3" />
                <span>{t("pinned")}</span>
              </div>
            )}

            {/* Reactions row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {Object.entries(grouped).map(([emoji, { count, profileIds }]) => {
                const isMine = profileIds.includes(currentProfileId);
                const reactors = profileIds
                  .map((pid) => users.find((u) => u.id === pid)?.name)
                  .filter(Boolean);
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(msg.id, emoji)}
                    title={reactors.join(", ")}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                      "border hover:bg-muted/80",
                      isMine
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="font-medium">{count}</span>
                  </button>
                );
              })}

              {/* Add reaction button */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  aria-label={t("addReaction")}
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors",
                    "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    showPicker && "bg-muted text-foreground"
                  )}
                >
                  <SmilePlus className="w-3.5 h-3.5" />
                </button>
                {showPicker && (
                  <div className="absolute bottom-full left-0 mb-1 z-10 bg-popover border border-border rounded-xl shadow-lg p-1.5 flex gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onToggleReaction(msg.id, emoji);
                          setShowPicker(false);
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-base transition-colors"
                        aria-label={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionCard({
  tx,
  users,
}: {
  tx: PointsTransaction;
  users: ReturnType<typeof useAppStore.getState>["users"];
}) {
  const t = useTranslations("board");
  const user = users.find((u) => u.id === tx.userId);
  const isPositive = tx.amount > 0;

  return (
    <Card className={cn("shadow-sm border-0", isPositive ? "bg-green-50/60" : "bg-orange-50/60")}>
      <CardContent className="pt-3 pb-3">
        <div className="flex gap-3 items-center">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
            isPositive ? "bg-green-100" : "bg-orange-100"
          )}>
            {tx.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{user?.name ?? t("unknownUser")}</span>
              {" "}
              <span className="text-muted-foreground">{tx.description}</span>
            </p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: es })}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
            )}
            <span className={cn(
              "font-bold text-sm",
              isPositive ? "text-green-600" : "text-orange-500"
            )}>
              {t("pointsAmount", { sign: isPositive ? "+" : "", amount: tx.amount })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
