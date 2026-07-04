"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RevealCard } from "@/components/RevealCard";
import { getPokemon } from "@/lib/api";
import type { Pokemon } from "@/types/pokemon";

type CardSelectionScreenProps = {
  revealedCards: (Pokemon | null)[];
  selectedPokemon: Pokemon[];
  error: string;
  isSubmitting: boolean;
  onRevealCard: (slotIndex: number, pokemon: Pokemon) => void;
  onSubmitTeam: () => void;
  onResetRun: () => void;
};

const TEAM_SIZE = 6;
const REVEAL_TICK_MS = 85;
const REVEAL_DURATION_MS = 1400;

export function CardSelectionScreen({
  revealedCards,
  selectedPokemon,
  error,
  isSubmitting,
  onRevealCard,
  onSubmitTeam,
  onResetRun,
}: CardSelectionScreenProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [previewBySlot, setPreviewBySlot] = useState<(Pokemon | null)[]>(
    createEmptySlots,
  );
  const [revealingSlot, setRevealingSlot] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedPokemon.map((selected) => selected.id)),
    [selectedPokemon],
  );
  const teamIsComplete = selectedPokemon.length === TEAM_SIZE;
  const isRevealing = revealingSlot !== null;

  useEffect(() => {
    let ignoreResult = false;

    getPokemon()
      .then((loadedPokemon) => {
        if (ignoreResult) {
          return;
        }

        setPokemon(loadedPokemon);
        setLoadError("");
      })
      .catch((caughtError) => {
        if (!ignoreResult) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Pokemon cards.",
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
      clearRevealTimers();
    };
  }, []);

  function revealCard(slotIndex: number) {
    if (isLoading || isRevealing || revealedCards[slotIndex]) {
      return;
    }

    const availablePokemon = pokemon.filter((candidate) => !selectedIds.has(candidate.id));

    if (availablePokemon.length === 0) {
      setLoadError("No Pokemon are available to draw.");
      return;
    }

    const finalPokemon = pickRandomPokemon(availablePokemon);
    setLoadError("");
    setRevealingSlot(slotIndex);

    intervalRef.current = window.setInterval(() => {
      setPreviewBySlot((currentSlots) => {
        const nextSlots = [...currentSlots];
        nextSlots[slotIndex] = pickRandomPokemon(availablePokemon);
        return nextSlots;
      });
    }, REVEAL_TICK_MS);

    timeoutRef.current = window.setTimeout(() => {
      clearRevealTimers();
      setPreviewBySlot((currentSlots) => {
        const nextSlots = [...currentSlots];
        nextSlots[slotIndex] = null;
        return nextSlots;
      });
      setRevealingSlot(null);
      onRevealCard(slotIndex, finalPokemon);
    }, REVEAL_DURATION_MS);
  }

  function clearRevealTimers() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  return (
    <section className="selection-screen" aria-label="Team card selection">
      <div className="selection-header">
        <p className="eyebrow">Build your party</p>
        <h1>Choose Six Cards</h1>
        <p>
          Tap each card to draw a unique Generation 1 Pokemon for the Champion run.
        </p>
      </div>

      <div className="selection-status">
        <strong>{selectedPokemon.length}/6 revealed</strong>
        <span>{isLoading ? "Loading deck..." : teamIsComplete ? "Team ready" : "Tap a card"}</span>
      </div>

      <div className="reveal-grid">
        {revealedCards.map((slotPokemon, index) => (
          <RevealCard
            canReveal={!isLoading && !isRevealing}
            index={index}
            isRevealing={revealingSlot === index}
            key={slotPokemon?.id ?? `slot-${index}`}
            onReveal={revealCard}
            pokemon={slotPokemon}
            previewPokemon={previewBySlot[index]}
          />
        ))}
      </div>

      {(loadError || error) && <p className="error-message">{loadError || error}</p>}

      <div className="selection-actions">
        {teamIsComplete ? (
          <button
            className="primary-action"
            type="button"
            disabled={isSubmitting}
            onClick={onSubmitTeam}
          >
            {isSubmitting ? "SCORING..." : "I CHOOSE YOU"}
          </button>
        ) : null}
        <button
          className="secondary-action"
          type="button"
          disabled={isRevealing || (selectedPokemon.length === 0 && !error)}
          onClick={onResetRun}
        >
          RESET RUN
        </button>
      </div>
    </section>
  );
}

function createEmptySlots() {
  return Array.from({ length: TEAM_SIZE }, () => null);
}

function pickRandomPokemon(pokemon: Pokemon[]) {
  return pokemon[Math.floor(Math.random() * pokemon.length)];
}
