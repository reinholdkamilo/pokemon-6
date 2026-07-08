"use client";

import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  didBeatOpponent,
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
  onSkipBattles,
  onViewResults,
}: GymLeadersScreenProps) {
  const gymBreakdowns = result.opponent_breakdown?.gym_leaders ?? [];
  const earnedBadges = new Set(result.badges_earned ?? []);
  const badgesRequired = result.badges_required ?? 8;
  const revealedBreakdowns = GYM_LEADERS.slice(0, revealedCount).map((leader) =>
    findBreakdown(gymBreakdowns, leader.name),
  );
  const hasLoss = revealedBreakdowns.some(
    (breakdown) => breakdown && !didBeatOpponent(breakdown),
  );
  const allBattlesRevealed = revealedCount >= GYM_LEADERS.length;
  const nextBattleIndex = Math.min(revealedCount, GYM_LEADERS.length - 1);
  const nextLeader = GYM_LEADERS[nextBattleIndex];
  const canChallengeEliteFour =
    !hasLoss && Boolean(result.elite_four_unlocked) && earnedBadges.size >= badgesRequired;

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
          {hasLoss ? (
            <button className="primary-action stage-action" type="button" onClick={onViewResults}>
              VIEW RESULTS
            </button>
          ) : !allBattlesRevealed ? (
            <>
              <button
                className="primary-action stage-action"
                type="button"
                onClick={() => onBattleLeader(nextBattleIndex)}
              >
                BATTLE {nextLeader.name.toUpperCase()}
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
            const isGreyedOutAfterLoss = hasLoss && !revealed;
            reachedPrevious = revealed ? reached && status === "cleared" : reachedPrevious;

            return (
              <div
                className={isGreyedOutAfterLoss ? "unchallenged-after-loss" : ""}
                key={leader.name}
              >
                <ProgressionCard
                  breakdown={breakdown}
                  meta={leader}
                  status={status}
                  showBadge
                />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
