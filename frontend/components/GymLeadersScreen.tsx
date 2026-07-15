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
  modeLabel: "Arcade Mode" | "Marathon Mode";
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

  const canChallengeEliteFour =
    !hasLoss &&
    allBattlesRevealed &&
    Boolean(result.elite_four_unlocked) &&
    earnedBadges.size >= badgesRequired;

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen" aria-label="Gym Leaders">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />

        <div className="stage-hero">
          <p className="eyebrow">Kanto badge journey</p>
          <h1>Gym Leaders</h1>
          {!hasLoss && !allBattlesRevealed ? (
            <p className="trainer-card-instruction">
              Select the highlighted trainer card to begin the next battle.
            </p>
          ) : null}
        </div>

        <div className="battle-choice-panel">
          {hasLoss ? (
            <button
              className="primary-action stage-action"
              type="button"
              onClick={onViewResults}
            >
              VIEW RESULTS
            </button>
          ) : !allBattlesRevealed ? (
            <button
              className="secondary-action"
              type="button"
              onClick={onSkipBattles}
            >
              SKIP BATTLES
            </button>
          ) : (
            <>
              <button
                className="primary-action stage-action"
                type="button"
                onClick={
                  canChallengeEliteFour ? onChallengeEliteFour : onViewResults
                }
              >
                {canChallengeEliteFour
                  ? "CHALLENGE ELITE FOUR"
                  : "VIEW FINAL RESULTS"}
              </button>

              <button
                className="secondary-action"
                type="button"
                onClick={onResetRun}
              >
                RESET RUN
              </button>
            </>
          )}
        </div>

        <div className="stage-card-grid gym-stage-grid">
          {GYM_LEADERS.map((leader, index) => {
            const breakdown = findBreakdown(gymBreakdowns, leader.name);
            const revealed = index < revealedCount;
            const status = revealed
              ? getBattleStatus(breakdown, Boolean(breakdown))
              : "pending";

            const isNextTrainer =
              !hasLoss &&
              !allBattlesRevealed &&
              index === revealedCount;

            const isLocked = !revealed && !isNextTrainer;

            return (
              <ProgressionCard
                breakdown={breakdown}
                isLocked={isLocked}
                isSelectable={isNextTrainer}
                key={leader.name}
                meta={leader}
                onSelect={() => onBattleLeader(index)}
                showBadge
                status={status}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
