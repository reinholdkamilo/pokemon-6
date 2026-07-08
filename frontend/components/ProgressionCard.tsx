"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, getTrainerSprite } from "@/lib/imagePaths";
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
  const displayName = meta.name === "Gary" ? "Champion" : meta.name;
  const teamLayoutClass =
    meta.pokemonTeam.length <= 3 ? "team-count-small" : "team-count-large";

  const championClass = meta.name === "Gary" ? "champion-progression-card" : "";

  return (
    <article className={`progression-card ${status} ${teamLayoutClass} ${championClass}`}>
      <div className="progression-card-top">
        <strong className="trainer-card-name-label">{displayName}</strong>

        {showBadge && meta.badge ? (
          <LocalSprite
            alt={`${meta.badge} sprite`}
            className="trainer-card-badge-sprite"
            fallback={String(meta.number ?? "BD")}
            src={BADGE_IMAGE_PATHS[meta.badge]}
          />
        ) : null}
      </div>

      {outcome ? <strong className="result-stamp">{outcome}</strong> : null}

      <div className="progression-sprite-area">
        <LocalSprite
          alt={`${meta.name} sprite`}
          className="trainer-sprite stage-trainer-sprite"
          fallback={meta.fallback}
          src={getTrainerSprite(meta.name)}
        />
      </div>

      <ul className="trainer-team-list" aria-label={`${meta.name} Pokemon team`}>
        {meta.pokemonTeam.map((pokemonName, index) => (
          <li key={`${pokemonName}-${index}`}>
            <span className="trainer-team-pokeball" aria-hidden="true" />
            <span>{pokemonName}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
