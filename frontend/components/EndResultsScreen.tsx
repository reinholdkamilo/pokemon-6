"use client";

import type { ReactNode } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { ProgressionCard } from "@/components/ProgressionCard";
import { BADGE_IMAGE_PATHS, getPlayerTrainerSprite } from "@/lib/imagePaths";
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
  modeLabel: "Battle Mode" | "Adventure Mode";
  onMainMenu: () => void;
  onTryAgain: () => void;
};

export function EndResultsScreen({
  trainerProfile,
  result,
  selectedPokemon,
  modeLabel,
  onMainMenu,
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
  const earnedBadgeNames = getEarnedBadgeNames(result);
  const badgesEarned = earnedBadgeNames.length;
  const teamPower = getFinalTeamPower(result);
  const resultRank = getResultRank(result);

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen end-results-screen" aria-label="End results">
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />
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
          <ResultsTrainerCard
            badges={earnedBadgeNames}
            fallback={trainerProfile.sprite === "player-male" ? "M" : "F"}
            hometown={trainerProfile.hometown}
            name={playerName}
            power={teamPower}
            rank={resultRank}
            spriteSrc={getPlayerTrainerSprite(trainerProfile.sprite)}
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

type ResultsTrainerCardProps = {
  badges: string[];
  fallback: string;
  hometown?: string;
  name: string;
  power: number;
  rank: string;
  spriteSrc: string;
};

function ResultsTrainerCard({
  badges,
  fallback,
  hometown,
  name,
  power,
  rank,
  spriteSrc,
}: ResultsTrainerCardProps) {
  return (
    <article className="battle-trainer-card results-trainer-card">
      <div className="battle-trainer-card__top results-trainer-card__top">
        <span className="results-trainer-card__logo">POKEMON 6</span>
        <strong>POWER {power}</strong>
      </div>

      <LocalSprite
        alt={`${name} trainer sprite`}
        className="battle-trainer-card__sprite"
        fallback={fallback}
        src={spriteSrc}
      />

      <div className="battle-trainer-card__identity">
        <p className="results-trainer-card__rank">{rank}</p>
        <h2 className="battle-trainer-card__name">{name}</h2>
        {hometown ? <p>{hometown}</p> : null}
      </div>

      <section className="results-trainer-card__badges" aria-label="Earned badges">
        {badges.length > 0 ? (
          badges.map((badge) => (
            <img
              alt={badge}
              className="results-trainer-card__badge"
              key={badge}
              src={BADGE_IMAGE_PATHS[badge]}
            />
          ))
        ) : (
          <strong className="results-trainer-card__no-badges">NO BADGES</strong>
        )}
      </section>
    </article>
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

function getFinalTeamPower(result: TeamScoreResult) {
  const possibleScores = [
    result.total_score,
    result.team_score,
    result.score,
    result.battle_score_breakdown?.final_score,
    result.battle_score_breakdown?.team_score,
    result.battle_score_breakdown?.average_adjusted_score,
  ];

  const score = possibleScores.find((value) => typeof value === "number");

  return Math.round(score ?? 0);
}

function getResultRank(result: TeamScoreResult) {
  const championBreakdown = findBreakdown(
    result.opponent_breakdown?.champion,
    CHAMPION.name,
  );
  const eliteFourBreakdowns = result.opponent_breakdown?.elite_four ?? [];
  const championBeaten =
    didBeatOpponent(championBreakdown) ||
    result.result?.toLowerCase().includes("win") ||
    result.path_result?.toLowerCase().includes("champion gary beaten");

  if (championBeaten) {
    return "POKEMON MASTER";
  }

  const eliteFourBeaten =
    ELITE_FOUR.every((member) =>
      didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
    ) ||
    result.path_result
      ?.toLowerCase()
      .includes("elite four beaten, champion gary not beaten");

  if (eliteFourBeaten) {
    return "POKEMON CHAMPION";
  }

  if (getEarnedBadgeNames(result).length >= GYM_LEADERS.length) {
    return "POKEMON TRAINER";
  }

  return "BEGINNER";
}

function getEarnedBadgeNames(result: TeamScoreResult) {
  const gymBreakdowns = result.opponent_breakdown?.gym_leaders ?? [];
  const earnedFromBattles = GYM_LEADERS.flatMap((leader) => {
    const breakdown = findBreakdown(gymBreakdowns, leader.name);

    if (!breakdown || !leader.badge) {
      return [];
    }

    return breakdown.badge_earned || didBeatOpponent(breakdown) ? [leader.badge] : [];
  });

  if (earnedFromBattles.length > 0 || gymBreakdowns.length > 0) {
    return earnedFromBattles;
  }

  return (result.badges_earned ?? []).filter((badge) => BADGE_IMAGE_PATHS[badge]);
}
