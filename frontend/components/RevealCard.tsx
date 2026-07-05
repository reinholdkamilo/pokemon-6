"use client";

import { LocalSprite } from "@/components/LocalSprite";
import type { Pokemon } from "@/types/pokemon";

type RevealCardProps = {
  index: number;
  pokemon: Pokemon | null;
  previewPokemon: Pokemon | null;
  isRevealing: boolean;
  canReveal: boolean;
  onReveal: (index: number) => void;
};

const LEGENDARY_NAMES = new Set(["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"]);

export function RevealCard({
  index,
  pokemon,
  previewPokemon,
  isRevealing,
  canReveal,
  onReveal,
}: RevealCardProps) {
  const displayPokemon = previewPokemon ?? pokemon;
  const isLocked = Boolean(pokemon);
  const shouldShowPokemonImage = isLocked && !isRevealing && Boolean(pokemon?.image);
  const typeClass = displayPokemon
    ? `type-${displayPokemon.primary_type.toLowerCase()}`
    : "type-blank";
  const isLegendary =
    Boolean(displayPokemon?.isLegendary) ||
    Boolean(displayPokemon && LEGENDARY_NAMES.has(displayPokemon.name));

  return (
    <button
      className={[
        "reveal-card",
        typeClass,
        isLocked ? "locked" : "",
        isRevealing ? "revealing" : "",
        isLegendary && isLocked ? "legendary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      disabled={!canReveal || isRevealing}
      onClick={() => onReveal(index)}
      aria-label={
        displayPokemon
          ? `Card ${index + 1}: ${displayPokemon.name}. Tap to re-spin.`
          : `Reveal team card ${index + 1}`
      }
    >
      <span className="card-portrait">
        {shouldShowPokemonImage ? (
          <LocalSprite
            alt={`${pokemon?.name ?? "Pokemon"} sprite`}
            className="pokemon-sprite"
            fallback={pokemon?.name.slice(0, 2).toUpperCase() ?? "PK"}
            src={pokemon?.image}
          />
        ) : isRevealing ? (
          "DRAWING"
        ) : isLocked ? (
          "RE-SPIN"
        ) : (
          "TAP"
        )}
      </span>

      <span className="card-name">{displayPokemon?.name ?? "Mystery Pokemon"}</span>
      <span className="card-type">
        {displayPokemon ? formatTypes(displayPokemon) : "Unknown Type"}
      </span>

      {/* TODO: Add shiny draw state and rate tuning in a later task. */}
      {isLegendary && isLocked ? <span className="legendary-tag">Legendary</span> : null}
    </button>
  );
}

function formatTypes(pokemon: Pokemon) {
  return [pokemon.primary_type, pokemon.secondary_type].filter(Boolean).join(" / ");
}
