"use client";

import { useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  didBeatOpponent,
  ELITE_FOUR,
  findBreakdown,
  getBattleStatus,
} from "@/lib/progression";
import type { TeamScoreResult } from "@/types/pokemon";

type EliteFourScreenProps = {
  result: TeamScoreResult;
  modeLabel: "Battle Mode" | "Adventure Mode";
  onChallengeChampion: () => void;
  onMainMenu: () => void;
  onViewResults: () => void;
};

export function EliteFourScreen({
  result,
  modeLabel,
  onChallengeChampion,
  onMainMenu,
  onViewResults,
}: EliteFourScreenProps) {
  const [battleRevealed, setBattleRevealed] = useState(false);
  const eliteFourBreakdowns = result.opponent_breakdown?.elite_four ?? [];
  const eliteFourBeaten =
    eliteFourBreakdowns.length >= ELITE_FOUR.length &&
    ELITE_FOUR.every((member) =>
      didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
    );
  let reachedPrevious = Boolean(result.elite_four_unlocked);

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen" aria-label="Elite Four">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />
        <div className="stage-hero">
          <p className="eyebrow">Indigo Plateau</p>
          <h1>Elite Four</h1>
          <p>Defeat all four members to reach the Champion.</p>
        </div>

        <button
          className="primary-action stage-action"
          type="button"
          onClick={
            !battleRevealed
              ? () => setBattleRevealed(true)
              : eliteFourBeaten
                ? onChallengeChampion
                : onViewResults
          }
        >
          {!battleRevealed
            ? "BATTLE"
            : eliteFourBeaten
              ? "CHALLENGE CHAMPION"
              : "VIEW FINAL RESULTS"}
        </button>

        <div className="stage-card-grid elite-stage-grid">
          {ELITE_FOUR.map((member) => {
            const breakdown = findBreakdown(eliteFourBreakdowns, member.name);
            const reached = reachedPrevious && Boolean(breakdown);
            const status = battleRevealed
              ? getBattleStatus(breakdown, reached)
              : "pending";
            reachedPrevious = reached && status === "cleared";

            return (
              <ProgressionCard
                breakdown={breakdown}
                key={member.name}
                meta={member}
                status={status}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
