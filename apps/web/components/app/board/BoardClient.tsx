"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchBoardMessages, postBoardMessage } from "@/lib/api/board";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import type { BoardMessage } from "@/lib/api/board";
import type { PointsTransaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pin,
  Send,
  Megaphone,
  Trophy,
  Gift,
  MessageCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
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
  message:      { icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   label: "Mensaje" },
  achievement:  { icon: Trophy,        color: "text-yellow-500", bg: "bg-yellow-50", label: "Logro" },
  reward:       { icon: Gift,          color: "text-purple-500", bg: "bg-purple-50", label: "Recompensa" },
  announcement: { icon: Megaphone,     color: "text-primary",    bg: "bg-orange-50", label: "Anuncio" },
  points:       { icon: Star,          color: "text-primary",    bg: "bg-orange-50", label: "Puntos" },
};

export default function BoardClient() {
  const { currentUser, users } = useAppStore();
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
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

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold">Tablón Familiar</h1>

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
                placeholder={`¿Qué quieres compartir, ${currentUser.name}?`}
                className="w-full text-sm resize-none bg-muted/50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sending ? "Publicando..." : "Publicar"}
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
            <Pin className="w-3 h-3" /> Anclado
          </div>
          {pinnedMessages.map((msg) => (
            <BoardMessageCard key={msg.id} msg={msg} users={users} />
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
                <p className="font-medium">El tablón está vacío</p>
                <p className="text-sm mt-1">Escribe algo para empezar</p>
              </CardContent>
            </Card>
          )}
          {feed.map((item) =>
            item.type === "board" ? (
              <BoardMessageCard
                key={item.id}
                msg={item.data as BoardMessage}
                users={users}
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

function BoardMessageCard({
  msg,
  users,
}: {
  msg: BoardMessage;
  users: ReturnType<typeof useAppStore.getState>["users"];
}) {
  const author = users.find((u) => u.id === msg.profileId);
  const isSystem = !msg.profileId;
  const typeConfig = MSG_TYPE_CONFIG[msg.type] ?? MSG_TYPE_CONFIG.message;
  const TypeIcon = typeConfig.icon;

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
                {isSystem ? "FamilyRewards" : author?.name ?? "Usuario"}
              </span>
              <Badge variant="outline" className={cn("text-[10px] border-0", typeConfig.bg, typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
            {msg.pinned && (
              <div className="flex items-center gap-1 text-xs text-primary mt-2">
                <Pin className="w-3 h-3" />
                <span>Anclado</span>
              </div>
            )}
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
              <span className="font-semibold">{user?.name ?? "Usuario"}</span>
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
              {isPositive ? "+" : ""}{tx.amount} pts
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
