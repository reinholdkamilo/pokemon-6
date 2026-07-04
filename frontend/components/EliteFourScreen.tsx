"use client";

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
  onChallengeChampion: () => void;
  onViewResults: () => void;
};

export function EliteFourScreen({
  result,
  onChallengeChampion,
  onViewResults,
}: EliteFourScreenProps) {
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
        <div className="stage-hero">
          <p className="eyebrow">Indigo Plateau</p>
          <h1>Elite Four</h1>
          <p>Defeat all four members to reach Champion Gary.</p>
        </div>

        <div className="stage-card-grid elite-stage-grid">
          {ELITE_FOUR.map((member) => {
            const breakdown = findBreakdown(eliteFourBreakdowns, member.name);
            const reached = reachedPrevious && Boolean(breakdown);
            const status = getBattleStatus(breakdown, reached);
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

        <button
          className="primary-action stage-action"
          type="button"
          onClick={eliteFourBeaten ? onChallengeChampion : onViewResults}
        >
          {eliteFourBeaten ? "CHALLENGE CHAMPION" : "VIEW FINAL RESULTS"}
        </button>
      </section>
    </main>
  );
}
