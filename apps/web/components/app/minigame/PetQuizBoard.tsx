"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { MinigameDifficulty } from "@/lib/types";
import { QUIZ_CONFIG, type GameScore } from "@/lib/minigame/constants";
import { generateRandomPet, generateSimilarOptions, shuffle, maybeAddAccessory } from "@/lib/minigame/pet-generators";
import type { PetCardConfig } from "@/lib/minigame/constants";
import { MiniPetDisplay } from "./MiniPetDisplay";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetQuizBoardProps {
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

interface Round {
  target: PetCardConfig;
  options: PetCardConfig[];
  correctIndex: number;
}

function generateRound(): Round {
  const target = generateRandomPet();
  maybeAddAccessory(target, 0.5);
  const distractors = generateSimilarOptions(target, 3);
  const options = shuffle([target, ...distractors]);
  return { target, options, correctIndex: options.indexOf(target) };
}

export function PetQuizBoard({ difficulty, pointsBase, onComplete }: PetQuizBoardProps) {
  const t = useTranslations("minigame");
  const config = QUIZ_CONFIG[difficulty];

  const [round, setRound] = useState(0);
  const [currentRound, setCurrentRound] = useState<Round>(() => generateRound());
  const [phase, setPhase] = useState<"showing" | "choosing" | "feedback">("showing");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Show target then transition to choosing
  useEffect(() => {
    if (phase !== "showing") return;
    const showTime = Math.max(
      config.minShowTimeMs,
      config.showTimeMs - round * 150,
    );
    const timeout = setTimeout(() => setPhase("choosing"), showTime);
    return () => clearTimeout(timeout);
  }, [phase, round, config]);

  const handleChoice = useCallback(
    (idx: number) => {
      if (phase !== "choosing" || done) return;
      setSelectedIdx(idx);
      const isCorrect = idx === currentRound.correctIndex;
      if (isCorrect) setCorrectCount((c) => c + 1);
      setPhase("feedback");

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= config.rounds) {
          // Game over
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const perfect = correctCount + (isCorrect ? 1 : 0) === config.rounds;
          const accuracy = (correctCount + (isCorrect ? 1 : 0)) / config.rounds;
          const speedBonus = Math.max(0, Math.floor(pointsBase * (1 - timer / config.maxTimeForBonus)));
          const accuracyBonus = Math.floor(pointsBase * accuracy);
          onComplete({
            pairsFound: correctCount + (isCorrect ? 1 : 0),
            totalPairs: config.rounds,
            moves: config.rounds,
            timeSeconds: timer,
            perfect,
            score: {
              base: pointsBase,
              speedBonus,
              accuracyBonus,
              total: pointsBase + speedBonus + accuracyBonus,
            },
          });
        } else {
          setRound(nextRound);
          setCurrentRound(generateRound());
          setSelectedIdx(null);
          setPhase("showing");
        }
      }, 1000);
    },
    [phase, done, currentRound, round, config, correctCount, timer, pointsBase, onComplete],
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
        <div className="text-sm font-semibold">
          {t("round")} {round + 1}/{config.rounds}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{correctCount}</span>
        </div>
      </div>

      {/* Showing phase — display target */}
      {phase === "showing" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm font-medium text-muted-foreground">{t("quizMemorize")}</p>
          <div className="w-32 h-32 sm:w-40 sm:h-40">
            <MiniPetDisplay pet={currentRound.target} />
          </div>
          <div className="w-24 h-1 bg-primary/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-shrink" />
          </div>
        </div>
      )}

      {/* Choosing / feedback phase — show options */}
      {(phase === "choosing" || phase === "feedback") && (
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("quizWhichOne")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {currentRound.options.map((opt, idx) => {
              const isCorrect = idx === currentRound.correctIndex;
              const isSelected = selectedIdx === idx;
              const showResult = phase === "feedback";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChoice(idx)}
                  disabled={phase === "feedback"}
                  className={cn(
                    "aspect-square rounded-xl border-3 p-2 transition-all",
                    showResult && isCorrect && "border-green-500 bg-green-50 ring-2 ring-green-300",
                    showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 ring-2 ring-red-300",
                    !showResult && "border-border hover:border-primary/50 cursor-pointer active:scale-95",
                    showResult && !isCorrect && !isSelected && "opacity-40",
                  )}
                >
                  <div className="w-full h-full relative">
                    <MiniPetDisplay pet={opt} />
                    {showResult && isCorrect && (
                      <CheckCircle className="absolute top-0 right-0 w-6 h-6 text-green-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="absolute top-0 right-0 w-6 h-6 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
