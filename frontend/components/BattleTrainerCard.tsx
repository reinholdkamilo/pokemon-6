"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { Pokemon, TrainerProfile } from "@/types/pokemon";

type BattleTrainerCardProps = {
  badges: number | string;
  className?: string;
  fallback: string;
  hometown?: string;
  name: string;
  pokemonCount: number;
  role?: string;
  spriteSrc: string;
  team?: Pokemon[];
};

export function BattleTrainerCard({
  badges,
  className = "",
  fallback,
  hometown,
  name,
  pokemonCount,
  role,
  spriteSrc,
  team,
}: BattleTrainerCardProps) {
  const visibleTeam = team?.slice(0, pokemonCount) ?? [];

  return (
    <article className={`battle-trainer-card ${className}`.trim()}>
      <div className="battle-trainer-card__top">
        {role ? <span>{role}</span> : null}
        <strong>{pokemonCount} Pokemon</strong>
      </div>

      <LocalSprite
        alt={`${name} trainer sprite`}
        className="battle-trainer-card__sprite"
        fallback={fallback}
        src={spriteSrc}
      />

      <div className="battle-trainer-card__identity">
        <h2 className="battle-trainer-card__name">{name}</h2>
        {hometown ? <p>{hometown}</p> : null}
      </div>

      <dl className="battle-trainer-card__meta">
        <div>
          <dt>Pokemon</dt>
          <dd>{pokemonCount}</dd>
        </div>
        <div>
          <dt>Known type</dt>
          <dd>Mixed</dd>
        </div>
        <div>
          <dt>Badges</dt>
          <dd>{badges}</dd>
        </div>
      </dl>

      {visibleTeam.length > 0 ? (
        <div className="battle-trainer-card__team" aria-label={`${name} team`}>
          {visibleTeam.map((pokemon) => (
            <LocalSprite
              alt={`${pokemon.name} sprite`}
              className="battle-trainer-card__team-sprite"
              fallback={pokemon.name.slice(0, 2).toUpperCase()}
              key={pokemon.id}
              src={pokemon.image}
            />
          ))}
        </div>
      ) : (
        <div className="pokeball-row compact" aria-label={`${pokemonCount} Pokemon`}>
          {Array.from({ length: pokemonCount }, (_, index) => (
            <span className="pokeball-dot" key={index} aria-hidden="true" />
          ))}
        </div>
      )}
    </article>
  );
}

export function createPlayerBattleTrainerCardProps(
  trainerProfile: TrainerProfile,
) {
  const playerName = trainerProfile.name || "Trainer";

  return {
    fallback: trainerProfile.sprite === "player-male" ? "M" : "F",
    hometown: trainerProfile.hometown,
    name: playerName,
    role: "Challenger",
    spriteSrc: getPlayerTrainerSprite(trainerProfile.sprite),
  };
}
