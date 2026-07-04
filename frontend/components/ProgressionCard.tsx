"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, TRAINER_IMAGE_PATHS } from "@/lib/imagePaths";
import {
  formatBattleOutcome,
  type BattleStatus,
  type OpponentMeta,
} from "@/lib/progression";
import type { OpponentBreakdown } from "@/types/pokemon";

type ProgressionCardProps = {
  meta: OpponentMeta;
  status: BattleStatus;
  breakdown?: OpponentBreakdown;
  showBadge?: boolean;
};

export function ProgressionCard({
  meta,
  status,
  breakdown,
  showBadge = false,
}: ProgressionCardProps) {
  const outcome = formatBattleOutcome(status, breakdown);

  return (
    <article className={`progression-card ${status}`}>
      <div className="progression-card-top">
        <span>{meta.number ? `GYM ${meta.number}` : meta.stage}</span>
        <strong>{outcome}</strong>
      </div>

      <LocalSprite
        alt={`${meta.name} sprite`}
        className="trainer-sprite stage-trainer-sprite"
        fallback={meta.fallback}
        src={TRAINER_IMAGE_PATHS[meta.name]}
      />

      <h2>{meta.name}</h2>
      <p>{meta.specialty} specialist</p>

      {showBadge && meta.badge ? (
        <div className="stage-badge-row">
          <LocalSprite
            alt={`${meta.badge} sprite`}
            className="mini-badge-sprite"
            fallback={String(meta.number ?? "BD")}
            src={BADGE_IMAGE_PATHS[meta.badge]}
          />
          <span>{meta.badge}</span>
          <strong>{status === "cleared" ? "Earned" : "Missing"}</strong>
        </div>
      ) : null}

      <div className="pokeball-row" aria-label={`${meta.pokemonCount} Pokemon`}>
        {Array.from({ length: meta.pokemonCount }, (_, index) => (
          <span className="pokeball-dot" key={index} aria-hidden="true" />
        ))}
      </div>

      {typeof breakdown?.matchup_score === "number" && status !== "not-reached" ? (
        <p className="stage-matchup">Matchup {breakdown.matchup_score}/100</p>
      ) : null}
    </article>
  );
}
