"use client";

import type { ReactNode } from "react";
import {
  BattleTrainerCard,
  createPlayerBattleTrainerCardProps,
} from "@/components/BattleTrainerCard";
import { LocalSprite } from "@/components/LocalSprite";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  CHAMPION,
  didBeatOpponent,
  ELITE_FOUR,
  findBreakdown,
  getBattleStatus,
  GYM_LEADERS,
} from "@/lib/progression";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

type EndResultsScreenProps = {
  trainerProfile: TrainerProfile;
  result: TeamScoreResult;
  selectedPokemon: Pokemon[];
  onTryAgain: () => void;
};

export function EndResultsScreen({
  trainerProfile,
  result,
  selectedPokemon,
  onTryAgain,
}: EndResultsScreenProps) {
  const championBreakdown = findBreakdown(
    result.opponent_breakdown?.champion,
    CHAMPION.name,
  );
  const championBeaten = didBeatOpponent(championBreakdown);
  const gymBreakdowns = result.opponent_breakdown?.gym_leaders ?? [];
  const eliteFourBreakdowns = result.opponent_breakdown?.elite_four ?? [];
  const playerName = trainerProfile.name || "Trainer";
  const badgesEarned = result.badges_earned?.length ?? 0;

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen end-results-screen" aria-label="End results">
        <div className="stage-hero">
          <p className="eyebrow">Final report</p>
          <h1>{championBeaten ? "YOU ARE THE NEW POKEMON CHAMPION" : "RUN COMPLETE"}</h1>
          <p>{playerName}</p>
        </div>

        <button className="primary-action stage-action" type="button" onClick={onTryAgain}>
          TRY AGAIN
        </button>

        <section className="results-team-section" aria-label="Player Trainer Card">
          <h2>Trainer Card</h2>
          <BattleTrainerCard
            {...createPlayerBattleTrainerCardProps(trainerProfile)}
            badges={badgesEarned}
            className="results-battle-trainer-card"
            pokemonCount={selectedPokemon.length}
            team={selectedPokemon}
          />
        </section>

        <section className="results-team-section" aria-label="Final Pokemon team">
          <h2>Final Team</h2>
          <div className="results-team-grid">
            {selectedPokemon.map((pokemon) => (
              <article
                className={`results-pokemon-card type-${pokemon.primary_type.toLowerCase()}`}
                key={pokemon.id}
              >
                <LocalSprite
                  alt={`${pokemon.name} sprite`}
                  className="results-pokemon-sprite"
                  fallback={pokemon.name.slice(0, 2).toUpperCase()}
                  src={pokemon.image}
                />
                <div>
                  <h3>{pokemon.name}</h3>
                  <p>{formatTypes(pokemon)}</p>
                  <strong>BST {pokemon.base_stat_total}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <ResultSection title="Gym Leaders">
          <ProgressionResults
            metas={GYM_LEADERS}
            breakdowns={gymBreakdowns}
            initialReached
            showBadge
          />
        </ResultSection>

        <ResultSection title="Elite Four">
          <ProgressionResults
            metas={ELITE_FOUR}
            breakdowns={eliteFourBreakdowns}
            initialReached={Boolean(result.elite_four_unlocked)}
          />
        </ResultSection>

        <ResultSection title="Champion Gary">
          <ProgressionResults
            metas={[CHAMPION]}
            breakdowns={result.opponent_breakdown?.champion ?? []}
            initialReached={ELITE_FOUR.every((member) =>
              didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
            )}
          />
        </ResultSection>
      </section>
    </main>
  );
}

type ResultSectionProps = {
  title: string;
  children: ReactNode;
};

function ResultSection({ title, children }: ResultSectionProps) {
  return (
    <section className="final-results-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

type ProgressionResultsProps = {
  metas: Array<(typeof GYM_LEADERS)[number]>;
  breakdowns: NonNullable<TeamScoreResult["opponent_breakdown"]>["gym_leaders"];
  initialReached: boolean;
  showBadge?: boolean;
};

function ProgressionResults({
  metas,
  breakdowns,
  initialReached,
  showBadge = false,
}: ProgressionResultsProps) {
  let reachedPrevious = initialReached;

  return (
    <div className="stage-card-grid final-stage-grid">
      {metas.map((meta) => {
        const breakdown = findBreakdown(breakdowns, meta.name);
        const reached = reachedPrevious && Boolean(breakdown);
        const status = getBattleStatus(breakdown, reached);
        reachedPrevious = reached && status === "cleared";

        return (
          <ProgressionCard
            breakdown={breakdown}
            key={meta.name}
            meta={meta}
            status={status}
            showBadge={showBadge}
          />
        );
      })}
    </div>
  );
}

function formatTypes(pokemon: Pokemon) {
  return [pokemon.primary_type, pokemon.secondary_type].filter(Boolean).join(" / ");
}
