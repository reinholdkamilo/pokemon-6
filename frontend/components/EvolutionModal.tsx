"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Pokemon } from "@/types/pokemon";

type EvolutionModalProps = {
  fromPokemon: Pokemon;
  toPokemon: Pokemon;
  canSkipAnimation?: boolean;
  onComplete: () => void;
};

type EvolutionStage = "intro" | "evolving" | "complete";

export function EvolutionModal({
  fromPokemon,
  toPokemon,
  canSkipAnimation = false,
  onComplete,
}: EvolutionModalProps) {
  const [stage, setStage] = useState<EvolutionStage>("intro");
  const completionStartedRef = useRef(false);

  useLayoutEffect(() => {
    setStage("intro");
    completionStartedRef.current = false;
  }, [fromPokemon.id, toPokemon.id]);

  useEffect(() => {
    if (stage !== "evolving") {
      return;
    }

    const timer = window.setTimeout(() => {
      setStage("complete");
    }, 3800);

    return () => window.clearTimeout(timer);
  }, [stage]);

  function completeEvolution() {
    if (completionStartedRef.current) {
      return;
    }

    completionStartedRef.current = true;
    onComplete();
  }

  return (
    <div className="evolution-modal-backdrop" role="dialog" aria-modal="true">
      <section className={`evolution-modal evolution-stage-${stage}`}>
        {stage === "intro" ? (
          <>
            <p className="eyebrow">Evolution</p>
            <h2>What? {fromPokemon.name} is evolving!</h2>
            <EvolutionPokemonCard pokemon={fromPokemon} />
            <div className="evolution-actions">
              <button
                className="primary-action evolution-action"
                type="button"
                onClick={() => setStage("evolving")}
              >
                NEXT
              </button>
              {canSkipAnimation ? (
                <button
                  className="secondary-action evolution-action"
                  type="button"
                  onClick={completeEvolution}
                >
                  SKIP EVOLUTION
                </button>
              ) : null}
            </div>
          </>
        ) : null}

        {stage === "evolving" ? (
          <>
            <p className="eyebrow">Evolution</p>
            <h2>{fromPokemon.name} is evolving...</h2>
            <div className="evolution-animation-stage">
              <EvolutionPokemonCard
                pokemon={fromPokemon}
                className="evolution-card-flash evolution-card-from"
              />
              <EvolutionPokemonCard
                pokemon={toPokemon}
                className="evolution-card-flash evolution-card-to"
              />
            </div>
            {canSkipAnimation ? (
              <button
                className="secondary-action evolution-action"
                type="button"
                onClick={completeEvolution}
              >
                SKIP EVOLUTION
              </button>
            ) : null}
          </>
        ) : null}

        {stage === "complete" ? (
          <>
            <p className="eyebrow">Evolution complete</p>
            <h2>Congratulations! Your {fromPokemon.name} evolved into {toPokemon.name}!</h2>
            <EvolutionPokemonCard pokemon={toPokemon} className="evolution-card-final" />
            <button
              className="primary-action evolution-action"
              type="button"
              onClick={completeEvolution}
            >
              CONTINUE
            </button>
          </>
        ) : null}
      </section>
    </div>
  );
}

function EvolutionPokemonCard({
  pokemon,
  className = "",
}: {
  pokemon: Pokemon;
  className?: string;
}) {
  return (
    <article
      className={`evolution-pokemon-card type-${pokemon.primary_type.toLowerCase()} ${className}`}
    >
      <div className="evolution-pokemon-card__sprite-wrap">
        {pokemon.image ? (
          <img
            alt={pokemon.name}
            className="evolution-pokemon-card__sprite"
            src={pokemon.image}
          />
        ) : (
          <span className="sprite-fallback">?</span>
        )}
      </div>
      <strong className="evolution-pokemon-card__name">{pokemon.name}</strong>
      <span className="evolution-pokemon-card__type">
        {pokemon.primary_type}
        {pokemon.secondary_type ? ` / ${pokemon.secondary_type}` : ""}
      </span>
      <span className="evolution-pokemon-card__stat">BST {pokemon.base_stat_total}</span>
    </article>
  );
}
