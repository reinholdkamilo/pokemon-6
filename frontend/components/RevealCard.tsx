"use client";

import type { Pokemon } from "@/types/pokemon";

type RevealCardProps = {
  index: number;
  pokemon: Pokemon | null;
  previewPokemon: Pokemon | null;
  isRevealing: boolean;
  isCharging: boolean;
  canReveal: boolean;
  onReveal: (index: number) => void;
  onStartHold: (index: number) => void;
  onFinishHold: (index: number) => void;
  onCancelHold: (index: number) => void;
};

const LEGENDARY_NAMES = new Set(["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"]);

export function RevealCard({
  index,
  pokemon,
  previewPokemon,
  isRevealing,
  isCharging,
  canReveal,
  onReveal,
  onStartHold,
  onFinishHold,
  onCancelHold,
}: RevealCardProps) {
  const displayPokemon = previewPokemon ?? pokemon;
  const isLocked = Boolean(pokemon);
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
        "mystery-reveal-card",
        typeClass,
        isLocked ? "locked" : "",
        isRevealing ? "revealing" : "",
        isCharging ? "charging" : "",
        isLegendary && isLocked ? "legendary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      disabled={!canReveal || isRevealing || isLocked}
      onPointerDown={() => onStartHold(index)}
      onPointerUp={() => onFinishHold(index)}
      onPointerLeave={() => onCancelHold(index)}
      onPointerCancel={() => onCancelHold(index)}
      onClick={(event) => {
        event.preventDefault();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onReveal(index);
      }}
      aria-label={
        displayPokemon
          ? `Card ${index + 1}: ${displayPokemon.name}`
          : `Reveal team card ${index + 1}`
      }
    >
      <span className="card-portrait">
        {displayPokemon ? (
          <span className="mystery-card-revealed">
            {displayPokemon.image ? (
              <img
                alt={displayPokemon.name}
                className="pokemon-sprite mystery-card-sprite"
                src={displayPokemon.image}
              />
            ) : (
              <span className="sprite-fallback">?</span>
            )}
            <strong className="mystery-card-name">{displayPokemon.name}</strong>
            <span className="mystery-card-types">
              {displayPokemon.primary_type}
              {displayPokemon.secondary_type ? ` / ${displayPokemon.secondary_type}` : ""}
            </span>
            <span className="mystery-card-stat">
              BST {displayPokemon.base_stat_total}
            </span>
          </span>
        ) : (
          <span className="mystery-card-template" aria-hidden="true">
            <span className="mystery-question">?</span>
            <span className="mystery-label">Mystery Pokémon</span>
          </span>
        )}
      </span>
    </button>
  );
}
