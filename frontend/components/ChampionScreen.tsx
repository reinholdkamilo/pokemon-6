"use client";

import { useState } from "react";
import {
  BattleTrainerCard,
  createPlayerBattleTrainerCardProps,
} from "@/components/BattleTrainerCard";
import { TRAINER_IMAGE_PATHS } from "@/lib/imagePaths";
import {
  CHAMPION,
  didBeatOpponent,
  findBreakdown,
  formatBattleOutcome,
  getBattleStatus,
} from "@/lib/progression";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

type ChampionScreenProps = {
  trainerProfile: TrainerProfile;
  result: TeamScoreResult;
  selectedPokemon: Pokemon[];
  onViewResults: () => void;
};

export function ChampionScreen({
  trainerProfile,
  result,
  selectedPokemon,
  onViewResults,
}: ChampionScreenProps) {
  const [battleRevealed, setBattleRevealed] = useState(false);
  const championBreakdown = findBreakdown(
    result.opponent_breakdown?.champion,
    CHAMPION.name,
  );
  const championStatus = battleRevealed
    ? getBattleStatus(championBreakdown, Boolean(championBreakdown))
    : "pending";
  const championBeaten = didBeatOpponent(championBreakdown);
  const playerName = trainerProfile.name || "Trainer";
  const badgesEarned = result.badges_earned?.length ?? 0;
  const championStamp = formatBattleOutcome(championStatus, championBreakdown);

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen champion-screen" aria-label="Champion battle">
        <div className="stage-hero">
          <p className="eyebrow">Final challenge</p>
          <h1>Champion Battle</h1>
          <p>{playerName} versus Champion Gary</p>
        </div>

        <button
          className="primary-action stage-action"
          type="button"
          onClick={!battleRevealed ? () => setBattleRevealed(true) : onViewResults}
        >
          {!battleRevealed
            ? "BATTLE"
            : championBeaten
              ? "VIEW CHAMPION RESULTS"
              : "VIEW FINAL RESULTS"}
        </button>

        <div className="champion-versus-layout">
          <BattleTrainerCard
            {...createPlayerBattleTrainerCardProps(trainerProfile)}
            badges={badgesEarned}
            className="player-card"
            pokemonCount={6}
            team={selectedPokemon}
          />

          <div className="versus-mark" aria-hidden="true">
            VS
          </div>

          <div className={`champion-card ${championStatus}`}>
            {championStamp ? (
              <strong className="result-stamp">{championStamp}</strong>
            ) : null}
            <BattleTrainerCard
              badges={8}
              fallback={CHAMPION.fallback}
              hometown="Pallet Town"
              name="Gary"
              pokemonCount={CHAMPION.pokemonCount}
              role="Champion"
              spriteSrc={TRAINER_IMAGE_PATHS[CHAMPION.name]}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
