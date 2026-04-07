"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import type { BoardMessage } from "@/lib/mock-data/board";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Pin, Send, Megaphone, Trophy, Gift, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  message:      { icon: MessageCircle, color: "text-blue-500",   bg: "bg-blue-50",   label: "Mensaje" },
  achievement:  { icon: Trophy,        color: "text-yellow-500", bg: "bg-yellow-50", label: "Logro" },
  reward:       { icon: Gift,          color: "text-purple-500", bg: "bg-purple-50", label: "Recompensa" },
  announcement: { icon: Megaphone,     color: "text-primary",    bg: "bg-orange-50", label: "Anuncio" },
};

export default function BoardClient() {
  const { currentUser, users } = useAppStore();
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  if (!currentUser) return null;

  const handleLike = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const hasLiked = m.likes.includes(currentUser.id);
        return {
          ...m,
          likes: hasLiked
            ? m.likes.filter((id) => id !== currentUser.id)
            : [...m.likes, currentUser.id],
        };
      })
    );
  };

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    const msg: BoardMessage = {
      id: `bm-${Date.now()}`,
      userId: currentUser.id,
      type: "message",
      content: text,
      likes: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [msg, ...prev]);
    setNewMessage("");
  };

  const pinnedMessages = messages.filter((m) => m.pinned);
  const unpinnedMessages = messages.filter((m) => !m.pinned);

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
                <Button size="sm" onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Publicar
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
            <MessageCard
              key={msg.id}
              msg={msg}
              currentUserId={currentUser.id}
              onLike={handleLike}
              users={users}
            />
          ))}
        </div>
      )}

      {/* All messages */}
      <div className="space-y-3">
        {unpinnedMessages.map((msg) => (
          <MessageCard
            key={msg.id}
            msg={msg}
            currentUserId={currentUser.id}
            onLike={handleLike}
            users={users}
          />
        ))}
      </div>
    </div>
  );
}

function MessageCard({
  msg,
  currentUserId,
  onLike,
  users,
}: {
  msg: BoardMessage;
  currentUserId: string;
  onLike: (id: string) => void;
  users: ReturnType<typeof useAppStore.getState>["users"];
}) {
  const author = users.find((u) => u.id === msg.userId);
  const isSystem = msg.userId === "system";
  const typeConfig = TYPE_CONFIG[msg.type];
  const TypeIcon = typeConfig.icon;
  const hasLiked = msg.likes.includes(currentUserId);

  // Parse **bold** in content
  const renderContent = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

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
          {/* Avatar */}
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              isSystem ? cn("text-lg", typeConfig.bg) : "bg-orange-100 text-xl"
            )}
          >
            {isSystem ? <TypeIcon className={cn("w-4 h-4", typeConfig.color)} /> : author?.avatar}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold">
                {isSystem ? "FamilyRewards" : author?.name}
              </span>
              {!isSystem && (
                <Badge variant="outline" className={cn("text-[10px] border-0", typeConfig.bg, typeConfig.color)}>
                  {typeConfig.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
              </span>
            </div>

            <p className="text-sm text-foreground leading-relaxed">
              {renderContent(msg.content)}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => onLike(msg.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", hasLiked && "fill-current")} />
                {msg.likes.length > 0 && <span>{msg.likes.length}</span>}
              </button>
              {msg.pinned && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Pin className="w-3 h-3" />
                  <span>Anclado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
