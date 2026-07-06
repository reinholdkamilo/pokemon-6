"use client";

import { getPokemonCardImagePath } from "@/lib/imagePaths";
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
  const shouldShowCardImage = Boolean(displayPokemon) && (isLocked || isRevealing);
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
        {shouldShowCardImage && displayPokemon ? (
          <img
            alt={`${displayPokemon.name} card`}
            className="pokemon-card-png"
            src={getPokemonCardImagePath(displayPokemon)}
          />
        ) : isRevealing ? (
          <span className="card-back-fallback" aria-hidden="true" />
        ) : (
          <img alt="" className="pokemon-card-back" src="/images/card-back.png" />
        )}
      </span>
    </button>
  );
}
