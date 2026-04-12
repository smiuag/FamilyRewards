"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { MinigameDifficulty } from "@/lib/types";
import { ODDONE_CONFIG, type GameScore } from "@/lib/minigame/constants";
import {
  generateRandomPet,
  generateOddOne,
  generateSharesAttribute,
  shuffle,
  maybeAddAccessory,
  maybeAddBackground,
} from "@/lib/minigame/pet-generators";
import type { PetCardConfig } from "@/lib/minigame/constants";
import { MiniPetDisplay } from "./MiniPetDisplay";
import { Clock, CheckCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetOddOneBoardProps {
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
  reference: PetCardConfig;
  options: PetCardConfig[];
  oddIndex: number;
}

function generateRound(optionCount: number): Round {
  const reference = generateRandomPet();
  maybeAddAccessory(reference, 0.5);
  maybeAddBackground(reference, 0.5);
  const oddOne = generateOddOne(reference);
  // oddOne has no accessory and no background — stands out
  const similar = generateSharesAttribute(reference, optionCount - 1);
  for (const s of similar) {
    maybeAddAccessory(s, 0.3);
    maybeAddBackground(s, 0.3);
  }
  const options = shuffle([oddOne, ...similar]);
  return { reference, options, oddIndex: options.indexOf(oddOne) };
}

export function PetOddOneBoard({ difficulty, pointsBase, onComplete }: PetOddOneBoardProps) {
  const t = useTranslations("minigame");
  const config = ODDONE_CONFIG[difficulty];

  const [currentRound, setCurrentRound] = useState<Round>(() => generateRound(config.optionCount));
  const [phase, setPhase] = useState<"playing" | "feedback" | "timeout">("playing");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);
  const [roundTimer, setRoundTimer] = useState(config.roundTimeMs);

  // Use refs for values read inside timeouts to avoid stale closures
  const roundRef = useRef(0);
  const correctRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Round countdown
  useEffect(() => {
    if (phase !== "playing") return;
    setRoundTimer(config.roundTimeMs);
    roundTimerRef.current = setInterval(() => {
      setRoundTimer((t) => {
        if (t <= 100) {
          clearInterval(roundTimerRef.current!);
          setPhase("timeout");
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => { if (roundTimerRef.current) clearInterval(roundTimerRef.current); };
  }, [phase, roundRef.current, config.roundTimeMs]);

  // Handle timeout
  useEffect(() => {
    if (phase !== "timeout") return;
    const timeout = setTimeout(() => advanceRound(false), 1000);
    return () => clearTimeout(timeout);
  }, [phase]);

  function advanceRound(wasCorrect: boolean) {
    if (doneRef.current) return;
    if (wasCorrect) correctRef.current += 1;
    roundRef.current += 1;

    if (roundRef.current >= config.rounds) {
      finishGame();
    } else {
      setCurrentRound(generateRound(config.optionCount));
      setSelectedIdx(null);
      setPhase("playing");
    }
  }

  function finishGame() {
    doneRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);

    const finalCorrect = correctRef.current;
    const finalTimer = timer;
    const perfect = finalCorrect === config.rounds;
    const ratio = finalCorrect / config.rounds;
    const speedBonus = Math.max(0, Math.floor(pointsBase * (1 - finalTimer / config.maxTimeForBonus)));
    const accuracyBonus = Math.floor(pointsBase * ratio);
    onComplete({
      pairsFound: finalCorrect,
      totalPairs: config.rounds,
      moves: config.rounds,
      timeSeconds: finalTimer,
      perfect,
      score: {
        base: pointsBase,
        speedBonus,
        accuracyBonus,
        total: pointsBase + speedBonus + accuracyBonus,
      },
    });
  }

  const handleChoice = useCallback(
    (idx: number) => {
      if (phase !== "playing" || doneRef.current) return;
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      setSelectedIdx(idx);
      const isCorrect = idx === currentRound.oddIndex;
      setPhase("feedback");
      setTimeout(() => advanceRound(isCorrect), 1000);
    },
    [phase, currentRound.oddIndex],
  );

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const roundProgress = roundTimer / config.roundTimeMs;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{formatTime(timer)}</span>
        </div>
        <div className="text-sm font-semibold">
          {t("round")} {roundRef.current + 1}/{config.rounds}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{correctRef.current}</span>
        </div>
      </div>

      {/* Round timer bar */}
      {phase === "playing" && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              roundProgress > 0.3 ? "bg-primary" : "bg-red-500",
            )}
            style={{ width: `${roundProgress * 100}%` }}
          />
        </div>
      )}

      {/* Reference pet */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t("oddOneReference")}</p>
        <div className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-primary/30 rounded-xl p-1.5 overflow-hidden">
          <div className="w-full h-full scale-125">
            <MiniPetDisplay pet={currentRound.reference} />
          </div>
        </div>
      </div>

      {/* Options */}
      <div>
        <p className="text-center text-sm font-medium text-muted-foreground mb-2">
          {t("oddOneFindOdd")}
        </p>
        <div className={cn(
          "grid gap-2",
          config.optionCount <= 4 ? "grid-cols-2" : "grid-cols-3",
        )}>
          {currentRound.options.map((opt, idx) => {
            const isOdd = idx === currentRound.oddIndex;
            const isSelected = selectedIdx === idx;
            const showResult = phase === "feedback" || phase === "timeout";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleChoice(idx)}
                disabled={phase !== "playing"}
                className={cn(
                  "aspect-square rounded-xl border-2 p-1.5 transition-all",
                  showResult && isOdd && "border-green-500 bg-green-50 ring-2 ring-green-300",
                  showResult && isSelected && !isOdd && "border-red-500 bg-red-50",
                  !showResult && "border-border hover:border-primary/40 cursor-pointer active:scale-95",
                  showResult && !isOdd && !isSelected && "opacity-40",
                )}
              >
                <div className="w-full h-full overflow-hidden">
                  <div className="w-full h-full scale-125">
                    <MiniPetDisplay pet={opt} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {phase === "timeout" && (
        <p className="text-center text-sm font-bold text-red-500 flex items-center justify-center gap-1">
          <Timer className="w-4 h-4" /> {t("oddOneTimeUp")}
        </p>
      )}
    </div>
  );
}
