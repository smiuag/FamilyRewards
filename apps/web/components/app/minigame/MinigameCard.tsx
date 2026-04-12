"use client";

import { cn } from "@/lib/utils";
import type { GameCard } from "@/lib/minigame/constants";
import { MiniPetDisplay } from "./MiniPetDisplay";

interface MinigameCardProps {
  card: GameCard;
  isFlipped: boolean;
  isMatched: boolean;
  isWrong: boolean;
  onClick: () => void;
}

export function MinigameCard({ card, isFlipped, isMatched, isWrong, onClick }: MinigameCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={cn(
        "aspect-square rounded-xl cursor-pointer select-none",
        "transition-transform duration-100 active:scale-95",
        isMatched && "card-matched",
        isWrong && "card-wrong",
      )}
      style={{ perspective: "600px" }}
    >
      <div
        className={cn(
          "card-inner relative w-full h-full rounded-xl",
          (isFlipped || isMatched) && "card-flipped",
        )}
      >
        {/* Back face (face-down) */}
        <div className="card-face card-back rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-md border-2 border-primary/30">
          <span className="text-4xl sm:text-5xl opacity-60">🐾</span>
        </div>

        {/* Front face (pet) */}
        <div className="card-face card-front rounded-xl bg-card border-2 border-border flex items-center justify-center shadow-md overflow-hidden">
          <div className="w-full h-full scale-125">
            <MiniPetDisplay pet={card.pet} />
          </div>
        </div>
      </div>
    </button>
  );
}
