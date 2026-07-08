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

  return (
    <article className={`progression-card ${status}`}>
      <div className="progression-card-top">
        {meta.number ? <span>{`GYM ${meta.number}`}</span> : <span>{meta.name}</span>}
        {outcome ? <strong className="result-stamp">{outcome}</strong> : null}
      </div>

      <div className="progression-sprite-area">
        <LocalSprite
          alt={`${meta.name} sprite`}
          className="trainer-sprite stage-trainer-sprite"
          fallback={meta.fallback}
          src={getTrainerSprite(meta.name)}
        />
      </div>

      <h2>{meta.name === "Gary" ? "Champion" : meta.name}</h2>

      <ul className="trainer-team-list" aria-label={`${meta.name} Pokemon team`}>
        {meta.pokemonTeam.map((pokemonName, index) => (
          <li key={`${pokemonName}-${index}`}>
            <span className="trainer-team-pokeball" aria-hidden="true" />
            <span>{pokemonName}</span>
          </li>
        ))}
      </ul>

      {showBadge && meta.badge ? (
        <div className="stage-badge-row">
          <LocalSprite
            alt={`${meta.badge} sprite`}
            className="mini-badge-sprite"
            fallback={String(meta.number ?? "BD")}
            src={BADGE_IMAGE_PATHS[meta.badge]}
          />
          <span>{meta.badge}</span>
        </div>
      ) : null}
    </article>
  );
}
