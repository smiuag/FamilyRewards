"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/useAppStore";
import { useMinigameStore } from "@/lib/store/useMinigameStore";
import {
  fetchMinigameConfig,
  fetchTodayGamesCount,
  fetchWeeklyRanking,
  saveMinigameResult,
} from "@/lib/api/minigame";
import type { MinigameDifficulty } from "@/lib/types";
import { GAME_TYPES, GAME_LABELS, type MinigameType, type GameScore } from "@/lib/minigame/constants";
import { DifficultySelector } from "./DifficultySelector";
import { MinigameBoard } from "./MinigameBoard";
import { PetQuizBoard } from "./PetQuizBoard";
import { PetSequenceBoard } from "./PetSequenceBoard";
import { PetOddOneBoard } from "./PetOddOneBoard";
import { GameCompleteModal } from "./GameCompleteModal";
import { WeeklyRanking } from "./WeeklyRanking";

type Phase = "loading" | "menu" | "playing" | "complete";

export default function MinigameClient() {
  const t = useTranslations("minigame");
  const { currentUser, unlockFeature } = useAppStore();
  const {
    config,
    todayGamesPlayed,
    todayDate,
    loadConfig,
    setTodayGames,
    incrementTodayGames,
    loadWeeklyRanking,
  } = useMinigameStore();

  const [phase, setPhase] = useState<Phase>("loading");
  const [difficulty, setDifficulty] = useState<MinigameDifficulty>("easy");
  const [gameType, setGameType] = useState<MinigameType>("match");
  const [gameKey, setGameKey] = useState(0);
  const [lastResult, setLastResult] = useState<{
    moves: number;
    timeSeconds: number;
    perfect: boolean;
    score: GameScore;
  } | null>(null);

  // Load config & data on mount
  useEffect(() => {
    if (!currentUser) return;

    async function load() {
      try {
        const [cfg, count, ranking] = await Promise.all([
          fetchMinigameConfig(currentUser!.familyId),
          fetchTodayGamesCount(currentUser!.id),
          fetchWeeklyRanking(currentUser!.familyId),
        ]);
        loadConfig(cfg);

        const today = new Date().toISOString().slice(0, 10);
        if (todayDate !== today) {
          setTodayGames(count);
        } else if (count > todayGamesPlayed) {
          setTodayGames(count);
        }

        loadWeeklyRanking(ranking);

        if (cfg.enabled) {
          unlockFeature("minigame");
          setPhase("menu");
        } else {
          setPhase("menu");
        }
      } catch {
        toast.error(t("error"));
        setPhase("menu");
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const pickRandomGame = useCallback((): MinigameType => {
    return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
  }, []);

  const handleSelectDifficulty = useCallback((diff: MinigameDifficulty) => {
    setDifficulty(diff);
    setGameType(pickRandomGame());
    setGameKey((k) => k + 1);
    setLastResult(null);
    setPhase("playing");
  }, [pickRandomGame]);

  const handleGameComplete = useCallback(
    async (result: {
      pairsFound: number;
      totalPairs: number;
      moves: number;
      timeSeconds: number;
      perfect: boolean;
      score: GameScore;
    }) => {
      setLastResult({
        moves: result.moves,
        timeSeconds: result.timeSeconds,
        perfect: result.perfect,
        score: result.score,
      });
      setPhase("complete");

      if (!currentUser || !config) return;

      try {
        await saveMinigameResult({
          profileId: currentUser.id,
          familyId: currentUser.familyId,
          difficulty,
          pairsFound: result.pairsFound,
          totalPairs: result.totalPairs,
          moves: result.moves,
          timeSeconds: result.timeSeconds,
          pointsEarned: result.score.total,
          perfect: result.perfect,
        });
        incrementTodayGames();

        useAppStore.setState((s) => ({
          currentUser: s.currentUser
            ? { ...s.currentUser, pointsBalance: s.currentUser.pointsBalance + result.score.total }
            : null,
        }));

        const ranking = await fetchWeeklyRanking(currentUser.familyId);
        loadWeeklyRanking(ranking);
      } catch {
        toast.error(t("error"));
      }
    },
    [currentUser, config, difficulty, incrementTodayGames, loadWeeklyRanking, t],
  );

  const handlePlayAgain = useCallback(() => {
    setGameType(pickRandomGame());
    setGameKey((k) => k + 1);
    setLastResult(null);
    setPhase("playing");
  }, [pickRandomGame]);

  const handleBackToMenu = useCallback(() => {
    setPhase("menu");
    setLastResult(null);
  }, []);

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config?.enabled) {
    return (
      <div className="text-center py-20 space-y-3">
        <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">{t("disabled")}</p>
      </div>
    );
  }

  const gameLabel = GAME_LABELS[gameType];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {phase === "playing" && (
          <Button variant="ghost" size="icon" onClick={handleBackToMenu}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {phase === "playing" || phase === "complete" ? (
              <><span>{gameLabel.emoji}</span> {t(gameLabel.key)}</>
            ) : (
              <><Gamepad2 className="w-5 h-5" /> {t("title")}</>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Menu phase */}
      {phase === "menu" && (
        <div className="space-y-6">
          <DifficultySelector
            onSelect={handleSelectDifficulty}
            gamesPlayed={todayGamesPlayed}
            maxDaily={config.maxDaily}
          />
          <WeeklyRanking />
        </div>
      )}

      {/* Playing phase — render the selected game */}
      {(phase === "playing" || phase === "complete") && (
        <>
          {gameType === "match" && (
            <MinigameBoard
              key={gameKey}
              difficulty={difficulty}
              pointsBase={config.pointsBase}
              onComplete={handleGameComplete}
            />
          )}
          {gameType === "quiz" && (
            <PetQuizBoard
              key={gameKey}
              difficulty={difficulty}
              pointsBase={config.pointsBase}
              onComplete={handleGameComplete}
            />
          )}
          {gameType === "sequence" && (
            <PetSequenceBoard
              key={gameKey}
              difficulty={difficulty}
              pointsBase={config.pointsBase}
              onComplete={handleGameComplete}
            />
          )}
          {gameType === "oddone" && (
            <PetOddOneBoard
              key={gameKey}
              difficulty={difficulty}
              pointsBase={config.pointsBase}
              onComplete={handleGameComplete}
            />
          )}
        </>
      )}

      {/* Complete modal */}
      {lastResult && (
        <GameCompleteModal
          open={phase === "complete"}
          onOpenChange={(open) => { if (!open) handleBackToMenu(); }}
          difficulty={difficulty}
          moves={lastResult.moves}
          timeSeconds={lastResult.timeSeconds}
          perfect={lastResult.perfect}
          score={lastResult.score}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
