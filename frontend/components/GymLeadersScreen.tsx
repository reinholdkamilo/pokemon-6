"use client";

import { useState } from "react";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  findBreakdown,
  getBattleStatus,
  GYM_LEADERS,
} from "@/lib/progression";
import type { TeamScoreResult } from "@/types/pokemon";

type GymLeadersScreenProps = {
  result: TeamScoreResult;
  onChallengeEliteFour: () => void;
  onViewResults: () => void;
};

export function GymLeadersScreen({
  result,
  onChallengeEliteFour,
  onViewResults,
}: GymLeadersScreenProps) {
  const [battleRevealed, setBattleRevealed] = useState(false);
  const gymBreakdowns = result.opponent_breakdown?.gym_leaders ?? [];
  const earnedBadges = new Set(result.badges_earned ?? []);
  const badgesRequired = result.badges_required ?? 8;
  const canChallengeEliteFour =
    Boolean(result.elite_four_unlocked) && earnedBadges.size >= badgesRequired;
  let reachedPrevious = true;

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen" aria-label="Gym Leaders">
        <div className="stage-hero">
          <p className="eyebrow">Kanto badge journey</p>
          <h1>Gym Leaders</h1>
          <p>
            {earnedBadges.size}/{badgesRequired} badges earned
          </p>
        </div>

        <button
          className="primary-action stage-action"
          type="button"
          onClick={
            !battleRevealed
              ? () => setBattleRevealed(true)
              : canChallengeEliteFour
                ? onChallengeEliteFour
                : onViewResults
          }
        >
          {!battleRevealed
            ? "BATTLE"
            : canChallengeEliteFour
              ? "CHALLENGE ELITE FOUR"
              : "VIEW FINAL RESULTS"}
        </button>

        <div className="stage-card-grid gym-stage-grid">
          {GYM_LEADERS.map((leader) => {
            const breakdown = findBreakdown(gymBreakdowns, leader.name);
            const reached = reachedPrevious && Boolean(breakdown);
            const status = battleRevealed
              ? getBattleStatus(breakdown, reached)
              : "pending";
            reachedPrevious = reached && status === "cleared";

            return (
              <ProgressionCard
                breakdown={breakdown}
                key={leader.name}
                meta={leader}
                status={status}
                showBadge
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
