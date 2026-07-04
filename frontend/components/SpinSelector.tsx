"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPokemon } from "@/lib/api";
import type { Pokemon } from "@/types/pokemon";

type SpinSelectorProps = {
  selectedPokemon: Pokemon[];
  onAddPokemon: (pokemon: Pokemon) => void;
};

const SPIN_TICK_MS = 70;
const MIN_SPIN_MS = 1500;
const MAX_SPIN_MS = 2500;

export function SpinSelector({
  selectedPokemon,
  onAddPokemon,
}: SpinSelectorProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [displayPokemon, setDisplayPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedPokemon.map((selected) => selected.id)),
    [selectedPokemon],
  );

  const availablePokemon = useMemo(
    () => pokemon.filter((candidate) => !selectedIds.has(candidate.id)),
    [pokemon, selectedIds],
  );

  const teamIsFull = selectedPokemon.length >= 6;
  const canSpin =
    !isLoading && !isSpinning && !teamIsFull && availablePokemon.length > 0;

  useEffect(() => {
    let ignoreResult = false;

    getPokemon()
      .then((loadedPokemon) => {
        if (ignoreResult) {
          return;
        }

        setPokemon(loadedPokemon);
        setDisplayPokemon(loadedPokemon[0] ?? null);
        setError("");
      })
      .catch((caughtError) => {
        if (!ignoreResult) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Pokemon for the spinner.",
          );
        }
      })
      .finally(() => {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      });

    return () => {
      ignoreResult = true;
      clearSpinTimers();
    };
  }, []);

  function startSpin() {
    if (!canSpin) {
      return;
    }

    setError("");
    setIsSpinning(true);

    const spinPool = availablePokemon;
    const winningPokemon = pickRandomPokemon(spinPool);
    const spinDuration =
      MIN_SPIN_MS + Math.floor(Math.random() * (MAX_SPIN_MS - MIN_SPIN_MS));

    intervalRef.current = window.setInterval(() => {
      setDisplayPokemon(pickRandomPokemon(spinPool));
    }, SPIN_TICK_MS);

    timeoutRef.current = window.setTimeout(() => {
      clearSpinTimers();
      setDisplayPokemon(winningPokemon);
      setIsSpinning(false);
      onAddPokemon(winningPokemon);
    }, spinDuration);
  }

  function clearSpinTimers() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  const typeLabel = displayPokemon ? formatTypes(displayPokemon) : "Type";

  return (
    <section className="panel spin-panel" aria-label="Spin selector">
      <div className="spin-heading">
        <div>
          <p className="eyebrow">Main selection</p>
          <h2>Spin for your next Pokemon</h2>
        </div>
        <p className="spin-count">{selectedPokemon.length}/6 selected</p>
      </div>

      <div className="spin-display" aria-live="polite">
        <div className={`spin-box ${isSpinning ? "spinning" : ""}`}>
          <span>Pokemon</span>
          <strong>{displayPokemon?.name ?? "Loading..."}</strong>
        </div>
        <div className={`spin-box type-box ${isSpinning ? "spinning" : ""}`}>
          <span>Type</span>
          <strong>{typeLabel}</strong>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="spin-button"
        type="button"
        disabled={!canSpin}
        onClick={startSpin}
      >
        {isSpinning ? "Spinning..." : teamIsFull ? "Team Full" : "Spin"}
      </button>
    </section>
  );
}

function pickRandomPokemon(pokemon: Pokemon[]) {
  return pokemon[Math.floor(Math.random() * pokemon.length)];
}

function formatTypes(pokemon: Pokemon) {
  return [pokemon.primary_type, pokemon.secondary_type].filter(Boolean).join(" / ");
}
