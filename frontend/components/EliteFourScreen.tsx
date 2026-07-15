"use client";

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
  revealedCount: number;
  modeLabel: "Arcade Mode" | "Marathon Mode";
  onBattleEliteMember: (index: number) => void;
  onChallengeChampion: () => void;
  onMainMenu: () => void;
  onSkipBattles: () => void;
  onViewResults: () => void;
};

export function EliteFourScreen({
  result,
  revealedCount,
  modeLabel,
  onBattleEliteMember,
  onChallengeChampion,
  onMainMenu,
  onSkipBattles,
  onViewResults,
}: EliteFourScreenProps) {
  const eliteFourBreakdowns = result.opponent_breakdown?.elite_four ?? [];

  const revealedBreakdowns = ELITE_FOUR.slice(0, revealedCount).map((member) =>
    findBreakdown(eliteFourBreakdowns, member.name),
  );

  const hasLoss = revealedBreakdowns.some(
    (breakdown) => breakdown && !didBeatOpponent(breakdown),
  );

  const allBattlesRevealed = revealedCount >= ELITE_FOUR.length;

  const eliteFourBeaten =
    !hasLoss &&
    allBattlesRevealed &&
    ELITE_FOUR.every((member) =>
      didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
    );

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen" aria-label="Elite Four">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />

        <div className="stage-hero">
          <p className="eyebrow">Indigo Plateau</p>
          <h1>Elite Four</h1>
          <p>Defeat all four members to reach the Champion.</p>

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
            <button
              className="primary-action stage-action"
              type="button"
              onClick={eliteFourBeaten ? onChallengeChampion : onViewResults}
            >
              {eliteFourBeaten
                ? "CHALLENGE CHAMPION"
                : "VIEW FINAL RESULTS"}
            </button>
          )}
        </div>

        <div className="stage-card-grid elite-stage-grid">
          {ELITE_FOUR.map((member, index) => {
            const breakdown = findBreakdown(
              eliteFourBreakdowns,
              member.name,
            );

            const revealed = index < revealedCount;
            const status = revealed
              ? getBattleStatus(breakdown, Boolean(breakdown))
              : "pending";

            const isNextTrainer =
              Boolean(result.elite_four_unlocked) &&
              !hasLoss &&
              !allBattlesRevealed &&
              index === revealedCount;

            const isLocked = !revealed && !isNextTrainer;

            return (
              <ProgressionCard
                breakdown={breakdown}
                isLocked={isLocked}
                isSelectable={isNextTrainer}
                key={member.name}
                meta={member}
                onSelect={() => onBattleEliteMember(index)}
                status={status}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
