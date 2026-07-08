"use client";

import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  findBreakdown,
  getBattleStatus,
  GYM_LEADERS,
} from "@/lib/progression";
import type { TeamScoreResult } from "@/types/pokemon";

type GymLeadersScreenProps = {
  result: TeamScoreResult;
  revealedCount: number;
  modeLabel: "Battle Mode" | "Adventure Mode";
  onBattleLeader: (index: number) => void;
  onChallengeEliteFour: () => void;
  onMainMenu: () => void;
  onResetRun: () => void;
  onSimulateBattles: () => void;
  onSkipBattles: () => void;
  onViewResults: () => void;
};

export function GymLeadersScreen({
  result,
  revealedCount,
  modeLabel,
  onBattleLeader,
  onChallengeEliteFour,
  onMainMenu,
  onResetRun,
  onSimulateBattles,
  onSkipBattles,
  onViewResults,
}: GymLeadersScreenProps) {
  const gymBreakdowns = result.opponent_breakdown?.gym_leaders ?? [];
  const earnedBadges = new Set(result.badges_earned ?? []);
  const badgesRequired = result.badges_required ?? 8;
  const allBattlesRevealed = revealedCount >= GYM_LEADERS.length;
  const nextBattleIndex = Math.min(revealedCount, GYM_LEADERS.length - 1);
  const nextLeader = GYM_LEADERS[nextBattleIndex];
  const canChallengeEliteFour =
    Boolean(result.elite_four_unlocked) && earnedBadges.size >= badgesRequired;

  let reachedPrevious = true;

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen" aria-label="Gym Leaders">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />
        <div className="stage-hero">
          <p className="eyebrow">Kanto badge journey</p>
          <h1>Gym Leaders</h1>
          <p>
            {earnedBadges.size}/{badgesRequired} badges earned
          </p>
        </div>

        <div className="battle-choice-panel">
          {!allBattlesRevealed ? (
            <>
              <button
                className="primary-action stage-action"
                type="button"
                onClick={() => onBattleLeader(nextBattleIndex)}
              >
                BATTLE {nextLeader.name.toUpperCase()}
              </button>
              <button className="secondary-action" type="button" onClick={onSimulateBattles}>
                SIMULATE GYM LEADERS
              </button>
              <button className="secondary-action" type="button" onClick={onSkipBattles}>
                SKIP BATTLES
              </button>
            </>
          ) : (
            <>
              <button
                className="primary-action stage-action"
                type="button"
                onClick={canChallengeEliteFour ? onChallengeEliteFour : onViewResults}
              >
                {canChallengeEliteFour ? "CHALLENGE ELITE FOUR" : "VIEW FINAL RESULTS"}
              </button>
              <button className="secondary-action" type="button" onClick={onResetRun}>
                RESET RUN
              </button>
            </>
          )}
        </div>

        <div className="stage-card-grid gym-stage-grid">
          {GYM_LEADERS.map((leader, index) => {
            const breakdown = findBreakdown(gymBreakdowns, leader.name);
            const revealed = index < revealedCount;
            const reached = reachedPrevious && Boolean(breakdown);
            const status = revealed ? getBattleStatus(breakdown, reached) : "pending";
            reachedPrevious = revealed ? reached && status === "cleared" : reachedPrevious;

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
