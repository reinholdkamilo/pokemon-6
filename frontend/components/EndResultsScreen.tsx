"use client";

import type { ReactNode } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { ProgressionCard } from "@/components/ProgressionCard";
import { BADGE_IMAGE_PATHS, getPlayerTrainerSprite } from "@/lib/imagePaths";
import { getPlayerCharacterFallback } from "@/lib/playerCharacters";
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
  const teamPower = getFinalTeamPower(result);
  const resultRank = getResultRank(result);
  const scoreBreakdownRows = getScoreBreakdownRows(result);

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
            rank={resultRank}
            trainerProfile={trainerProfile}
          />
        </section>

        <section className="results-team-section" aria-label="Team score breakdown">
          <h2>Team Score</h2>
          <ScoreBreakdown
            overallScore={teamPower}
            rows={scoreBreakdownRows}
          />
        </section>

        <section className="results-team-section" aria-label="Final Pokemon team">
          <h2>Final Team</h2>
          <div className="results-team-grid">
            {selectedPokemon.map((pokemon) => (
              <article
                className={`results-pokemon-summary-card type-${pokemon.primary_type.toLowerCase()}`}
                key={pokemon.id}
              >
                <div className="results-pokemon-summary-card__sprite-wrap">
                  {pokemon.image ? (
                    <img
                      alt={pokemon.name}
                      className="results-pokemon-summary-card__sprite"
                      src={pokemon.image}
                    />
                  ) : (
                    <span className="sprite-fallback">?</span>
                  )}
                </div>
                <strong className="results-pokemon-summary-card__name">{pokemon.name}</strong>
                <span className="results-pokemon-summary-card__type">
                  {pokemon.primary_type}
                  {pokemon.secondary_type ? ` / ${pokemon.secondary_type}` : ""}
                </span>
                <span className="results-pokemon-summary-card__stat">
                  BST {pokemon.base_stat_total}
                </span>
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

        <ResultSection title="Champion">
          <ProgressionResults
            metas={[CHAMPION]}
            breakdowns={result.opponent_breakdown?.champion ?? []}
            className="champion-final-grid"
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
  rank: string;
  trainerProfile: TrainerProfile;
};

function ResultsTrainerCard({
  badges,
  rank,
  trainerProfile,
}: ResultsTrainerCardProps) {
  const playerName = trainerProfile.name || "Trainer";

  return (
    <article className="results-trainer-card">
      <div className="results-trainer-card__top">
        <span className="results-trainer-card__logo">POKEMON 6</span>
        <strong className="results-trainer-card__player-name">{playerName}</strong>
      </div>

      <div className="results-trainer-card__artwork" aria-label={`${playerName} trainer artwork`}>
        <LocalSprite
          alt={`${playerName} trainer sprite`}
          className="results-trainer-card__sprite"
          fallback={getPlayerCharacterFallback(trainerProfile.sprite)}
          src={getPlayerTrainerSprite(trainerProfile.sprite)}
        />
      </div>

      <div className="results-trainer-card__stats">
        <div>
          <span>Level</span>
          <strong>{rank}</strong>
        </div>
      </div>

      <section className="results-trainer-card__badges" aria-label="Earned badges">
        <strong className="results-trainer-card__badge-count">Badges</strong>
        {badges.length > 0 ? (
          <div className="results-trainer-card__badge-grid">
            {badges.map((badge) => (
              <LocalSprite
                alt={`${badge} badge earned`}
                className="results-trainer-card__badge"
                fallback={badge.slice(0, 2).toUpperCase()}
                key={badge}
                src={BADGE_IMAGE_PATHS[badge]}
              />
            ))}
          </div>
        ) : null}
        {badges.length === 0 ? (
          <span className="results-trainer-card__empty-badge-space" aria-hidden="true" />
        ) : null}
      </section>
    </article>
  );
}

type ScoreBreakdownProps = {
  overallScore: number;
  rows: ScoreBreakdownRow[];
};

type ScoreBreakdownRow = {
  label: string;
  value: number | null;
};

function ScoreBreakdown({ overallScore, rows }: ScoreBreakdownProps) {
  return (
    <div className="results-score-breakdown">
      <div className="results-score-breakdown__overall">
        <span>Team Score</span>
        <strong>{overallScore}%</strong>
      </div>
      <div className="results-score-breakdown__rows">
        {rows.map((row) => (
          <div className="results-score-breakdown__row" key={row.label}>
            <span>{row.label}</span>
            <strong>{formatScoreValue(row.value)}</strong>
          </div>
        ))}
      </div>
    </div>
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
  className?: string;
  showBadge?: boolean;
};

function ProgressionResults({
  metas,
  breakdowns,
  initialReached,
  className,
  showBadge = false,
}: ProgressionResultsProps) {
  let reachedPrevious = initialReached;

  return (
    <div className={["stage-card-grid", "final-stage-grid", className].filter(Boolean).join(" ")}>
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

  return clampScore(score);
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
    return "Pokémon Master";
  }

  const eliteFourBeaten =
    ELITE_FOUR.every((member) =>
      didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
    ) ||
    result.path_result
      ?.toLowerCase()
      .includes("elite four beaten, champion gary not beaten");

  if (eliteFourBeaten) {
    return "Pokémon Champion";
  }

  const badgeCount = getEarnedBadgeNames(result).length;

  if (badgeCount >= GYM_LEADERS.length) {
    return "Pokémon Expert";
  }

  if (badgeCount > 0) {
    return "Pokémon Trainer";
  }

  return "Beginner";
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

function getScoreBreakdownRows(result: TeamScoreResult): ScoreBreakdownRow[] {
  const scoreBreakdown = result.score_breakdown ?? {};
  const battleBreakdown = result.battle_score_breakdown ?? {};

  return [
    {
      label: "Base Stats / Team Power",
      value: firstNumber(
        scoreBreakdown.base_stat_strength,
        battleBreakdown.base_stat_strength,
        battleBreakdown.team_power,
        battleBreakdown.team_score,
      ),
    },
    {
      label: "Counter Matchup / Type Advantage",
      value: firstNumber(
        scoreBreakdown.matchup_spread,
        battleBreakdown.matchup_spread,
        battleBreakdown.counter_matchup,
        battleBreakdown.type_advantage,
      ),
    },
    {
      label: "Weakness Control",
      value: firstNumber(
        scoreBreakdown.weakness_management,
        battleBreakdown.weakness_management,
        battleBreakdown.weakness_control,
      ),
    },
    {
      label: "Team Balance",
      value: firstNumber(
        scoreBreakdown.type_balance,
        battleBreakdown.type_balance,
        battleBreakdown.team_balance,
      ),
    },
    {
      label: "Ace Pokemon / Ace Factor",
      value: firstNumber(
        battleBreakdown.ace_factor,
        battleBreakdown.ace_pokemon,
        battleBreakdown.ace_score,
        battleBreakdown.ace_bonus,
      ),
    },
  ];
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number") ?? null;
}

function formatScoreValue(value: number | null) {
  return value === null ? "N/A" : `${clampScore(value)}/100`;
}

function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}
