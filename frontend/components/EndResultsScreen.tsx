"use client";

import type { ReactNode } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import { BADGE_IMAGE_PATHS, getPokemonCardImagePath } from "@/lib/imagePaths";
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
            badgeCount={badgesEarned}
            power={teamPower}
            rank={resultRank}
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
              <img
                alt={`${pokemon.name} card`}
                className="results-pokemon-card-image"
                key={pokemon.id}
                src={getPokemonCardImagePath(pokemon)}
              />
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
  badgeCount: number;
  power: number;
  rank: string;
};

function ResultsTrainerCard({
  badges,
  badgeCount,
  power,
  rank,
}: ResultsTrainerCardProps) {
  return (
    <article className="results-trainer-card">
      <div className="results-trainer-card__top">
        <span className="results-trainer-card__logo">POKEMON 6</span>
        <strong>Power: {power}/100</strong>
      </div>

      <div className="results-trainer-card__stats">
        <div>
          <span>Level</span>
          <strong>{rank}</strong>
        </div>
        <div>
          <span>Badges</span>
          <strong>{badgeCount}/8</strong>
        </div>
        <div>
          <span>Power</span>
          <strong>{power}/100</strong>
        </div>
      </div>

      <section className="results-trainer-card__badges" aria-label="Earned badges">
        <strong className="results-trainer-card__badge-count">Badges: {badgeCount}/8</strong>
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
    return "Pokemon Master";
  }

  const eliteFourBeaten =
    ELITE_FOUR.every((member) =>
      didBeatOpponent(findBreakdown(eliteFourBreakdowns, member.name)),
    ) ||
    result.path_result
      ?.toLowerCase()
      .includes("elite four beaten, champion gary not beaten");

  if (eliteFourBeaten) {
    return "Pokemon Champion";
  }

  const badgeCount = getEarnedBadgeNames(result).length;

  if (badgeCount >= GYM_LEADERS.length) {
    return "Pokemon Expert";
  }

  if (badgeCount > 0) {
    return "Pokemon Trainer";
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
