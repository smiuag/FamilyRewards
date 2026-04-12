"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { MinigameDifficulty } from "@/lib/types";
import { SEQUENCE_CONFIG, type GameScore } from "@/lib/minigame/constants";
import { generateUniquePetConfigs } from "@/lib/minigame/pet-generators";
import type { PetCardConfig } from "@/lib/minigame/constants";
import { MiniPetDisplay } from "./MiniPetDisplay";
import { Clock, Eye, Pointer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PetSequenceBoardProps {
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

export function PetSequenceBoard({ difficulty, pointsBase, onComplete }: PetSequenceBoardProps) {
  const t = useTranslations("minigame");
  const config = SEQUENCE_CONFIG[difficulty];

  const [pool] = useState<PetCardConfig[]>(() => generateUniquePetConfigs(config.poolSize));
  const [sequence, setSequence] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"showing" | "input" | "feedback" | "done">("showing");
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [inputSoFar, setInputSoFar] = useState<number[]>([]);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [timer, setTimer] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Start first round
  useEffect(() => {
    startNewRound(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startNewRound(roundNum: number) {
    const nextIdx = Math.floor(Math.random() * config.poolSize);
    const newSequence = roundNum === 0 ? [nextIdx] : [...sequence, nextIdx];
    setSequence(newSequence);
    setRound(roundNum);
    setInputSoFar([]);
    setPhase("showing");

    // Play the sequence with highlights
    const gapMs = Math.max(100, config.showDelayMs / 2);
    let i = 0;
    const playNext = () => {
      if (i < newSequence.length) {
        setHighlightIdx(newSequence[i]);
        setTimeout(() => {
          setHighlightIdx(null);
          i++;
          setTimeout(playNext, gapMs);
        }, config.showDelayMs);
      } else {
        setPhase("input");
      }
    };
    setTimeout(playNext, 300);
  }

  const handleTap = useCallback(
    (poolIdx: number) => {
      if (phase !== "input") return;

      const expected = sequence[inputSoFar.length];
      setLastTap(poolIdx);
      setTimeout(() => setLastTap(null), 300);

      if (poolIdx === expected) {
        const newInput = [...inputSoFar, poolIdx];
        setInputSoFar(newInput);

        if (newInput.length === sequence.length) {
          // Round complete!
          const nextRound = round + 1;
          if (nextRound >= config.maxRounds) {
            // Game won!
            finishGame(nextRound, true);
          } else {
            setPhase("feedback");
            setTimeout(() => startNewRound(nextRound), 800);
          }
        }
      } else {
        // Wrong!
        setWrongIdx(poolIdx);
        setPhase("done");
        setTimeout(() => finishGame(round, false), 1000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, sequence, inputSoFar, round, config],
  );

  function finishGame(roundsCompleted: number, won: boolean) {
    if (timerRef.current) clearInterval(timerRef.current);
    const perfect = won;
    const ratio = roundsCompleted / config.maxRounds;
    const speedBonus = Math.max(0, Math.floor(pointsBase * (1 - timer / config.maxTimeForBonus)));
    const accuracyBonus = Math.floor(pointsBase * ratio);
    onComplete({
      pairsFound: roundsCompleted,
      totalPairs: config.maxRounds,
      moves: roundsCompleted,
      timeSeconds: timer,
      perfect,
      score: {
        base: pointsBase,
        speedBonus,
        accuracyBonus,
        total: pointsBase + speedBonus + accuracyBonus,
      },
    });
  }

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
          {t("round")} {round + 1}/{config.maxRounds}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          {phase === "showing" ? (
            <><Eye className="w-4 h-4 text-amber-500" /> {t("sequenceWatch")}</>
          ) : phase === "input" ? (
            <><Pointer className="w-4 h-4 text-primary" /> {t("sequenceRepeat")}</>
          ) : null}
        </div>
      </div>

      {/* Progress dots — always rendered to reserve space */}
      <div className={cn("flex justify-center gap-1.5 min-h-[10px]", phase !== "input" && "invisible")}>
        {sequence.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              i < inputSoFar.length ? "bg-primary scale-110" : "bg-muted",
            )}
          />
        ))}
      </div>

      {/* Pet pool */}
      <div className={cn(
        "grid gap-3",
        config.poolSize <= 4 ? "grid-cols-2" : "grid-cols-3",
      )}>
        {pool.map((pet, idx) => {
          const isHighlight = highlightIdx === idx;
          const isTapped = lastTap === idx;
          const isWrong = wrongIdx === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTap(idx)}
              disabled={phase !== "input"}
              className={cn(
                "aspect-square rounded-xl border-3 p-2 transition-all",
                isHighlight && "border-amber-400 bg-amber-50 ring-2 ring-amber-300 scale-105",
                isTapped && !isWrong && "border-primary bg-primary/5 scale-95",
                isWrong && "border-red-500 bg-red-50 ring-2 ring-red-300",
                !isHighlight && !isTapped && !isWrong && "border-border",
                phase === "input" && "cursor-pointer hover:border-primary/40 active:scale-95",
              )}
            >
              <div className="w-full h-full overflow-hidden">
                <div className="w-full h-full scale-125">
                  <MiniPetDisplay pet={pet} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback — fixed height to avoid layout shift */}
      <div className="h-5 flex items-center justify-center">
        {phase === "feedback" && (
          <p className="text-sm font-bold text-green-500">{t("sequenceCorrect")}</p>
        )}
        {phase === "done" && wrongIdx !== null && (
          <p className="text-sm font-bold text-red-500">{t("sequenceWrong")}</p>
        )}
      </div>
    </div>
  );
}
