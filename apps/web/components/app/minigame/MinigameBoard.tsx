"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { MinigameDifficulty } from "@/lib/types";
import {
  generatePetCards,
  calculateScore,
  DIFFICULTY_CONFIG,
  type GameCard,
  type GameScore,
} from "@/lib/minigame/constants";
import { MinigameCard } from "./MinigameCard";
import { Clock, MousePointerClick, Zap } from "lucide-react";

interface MinigameBoardProps {
  difficulty: MinigameDifficulty;
  pointsBase: number;
  onComplete: (result: {
    pairsFound: number;
    totalPairs: number;
    moves: number;
    timeSeconds: number;
    perfect: boolean;
    score: GameScore;
  }) => void;
}

export function MinigameBoard({ difficulty, pointsBase, onComplete }: MinigameBoardProps) {
  const t = useTranslations("minigame");
  const config = DIFFICULTY_CONFIG[difficulty];

  const [cards, setCards] = useState<GameCard[]>(() => generatePetCards(difficulty));
  const [selected, setSelected] = useState<string[]>([]); // 0-2 selected card IDs
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const wrongCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Handle pair evaluation when 2 cards are selected
  useEffect(() => {
    if (selected.length !== 2) return;

    const [firstId, secondId] = selected;
    const first = cards.find((c) => c.id === firstId);
    const second = cards.find((c) => c.id === secondId);
    if (!first || !second) return;

    setMoves((m) => m + 1);
    setLocked(true);

    if (first.pairId === second.pairId) {
      // Match!
      setComboCount((c) => c + 1);
      setShowCombo(true);
      const hideCombo = setTimeout(() => setShowCombo(false), 800);

      const markMatched = setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true }
              : c,
          ),
        );
        setSelected([]);
        setLocked(false);
      }, 500);

      return () => { clearTimeout(hideCombo); clearTimeout(markMatched); };
    } else {
      // No match
      wrongCount.current += 1;
      setComboCount(0);
      setWrongIds([firstId, secondId]);

      const flipBack = setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c,
          ),
        );
        setSelected([]);
        setWrongIds([]);
        setLocked(false);
      }, 800);

      return () => clearTimeout(flipBack);
    }
  }, [selected, cards]);

  // Check for game complete
  useEffect(() => {
    if (done) return;
    const allMatched = cards.length > 0 && cards.every((c) => c.isMatched);
    if (!allMatched) return;

    setDone(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const perfect = wrongCount.current === 0;
    const score = calculateScore(moves, timer, config.pairs, difficulty, pointsBase);
    onComplete({
      pairsFound: config.pairs,
      totalPairs: config.pairs,
      moves,
      timeSeconds: timer,
      perfect,
      score,
    });
  }, [cards, done, moves, timer, config.pairs, difficulty, pointsBase, onComplete]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (locked || done) return;

      setSelected((prev) => {
        if (prev.length >= 2) return prev;
        if (prev.includes(cardId)) return prev;
        return [...prev, cardId];
      });

      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return prev;
        return prev.map((c) =>
          c.id === cardId ? { ...c, isFlipped: true } : c,
        );
      });
    },
    [locked, done],
  );

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{formatTime(timer)}</span>
        </div>

        {showCombo && comboCount >= 2 && (
          <div className="combo-indicator flex items-center gap-1 text-sm font-bold text-amber-500">
            <Zap className="w-4 h-4" />
            {t("combo", { count: comboCount })}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          <span>{moves} {t("moves")}</span>
        </div>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${config.gridCols}, 1fr)` }}
      >
        {cards.map((card) => (
          <MinigameCard
            key={card.id}
            card={card}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            isWrong={wrongIds.includes(card.id)}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
