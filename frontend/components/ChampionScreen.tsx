"use client";

import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  CHAMPION,
  didBeatOpponent,
  findBreakdown,
  getBattleStatus,
} from "@/lib/progression";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

type ChampionScreenProps = {
  trainerProfile: TrainerProfile;
  result: TeamScoreResult;
  selectedPokemon: Pokemon[];
  revealed: boolean;
  modeLabel: "Battle Mode" | "Adventure Mode";
  onBattleChampion: () => void;
  onMainMenu: () => void;
  onSimulateBattle: () => void;
  onSkipBattle: () => void;
  onViewResults: () => void;
};

export function ChampionScreen({
  trainerProfile,
  result,
  revealed,
  modeLabel,
  onBattleChampion,
  onMainMenu,
  onSimulateBattle,
  onSkipBattle,
  onViewResults,
}: ChampionScreenProps) {
  const championBreakdown = findBreakdown(
    result.opponent_breakdown?.champion,
    CHAMPION.name,
  );
  const championStatus = revealed
    ? getBattleStatus(championBreakdown, Boolean(championBreakdown))
    : "pending";
  const championBeaten = didBeatOpponent(championBreakdown);
  const playerName = trainerProfile.name || "Trainer";

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen champion-screen" aria-label="Champion battle">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />
        <div className="stage-hero">
          <p className="eyebrow">Final challenge</p>
          <h1>Champion Battle</h1>
          <p>{playerName} versus Champion</p>
        </div>

        <div className="battle-choice-panel">
          {!revealed ? (
            <>
              <button
                className="primary-action stage-action"
                type="button"
                onClick={onBattleChampion}
              >
                BATTLE CHAMPION
              </button>
              <button className="secondary-action" type="button" onClick={onSimulateBattle}>
                SIMULATE CHAMPION
              </button>
              <button className="secondary-action" type="button" onClick={onSkipBattle}>
                SKIP BATTLE
              </button>
            </>
          ) : (
            <button className="primary-action stage-action" type="button" onClick={onViewResults}>
              {championBeaten ? "VIEW CHAMPION RESULTS" : "VIEW FINAL RESULTS"}
            </button>
          )}
        </div>

        <div className="stage-card-grid final-stage-grid champion-final-grid">
          <ProgressionCard
            breakdown={championBreakdown}
            meta={CHAMPION}
            status={championStatus}
          />
        </div>
      </section>
    </main>
  );
}
