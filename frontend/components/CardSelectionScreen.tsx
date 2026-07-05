"use client";

import { useEffect, useRef, useState } from "react";
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
const POWER_SPIN_HOLD_MS = 1300;
const LEGENDARY_NAMES = new Set(["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"]);

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
  const [chargingCardIndex, setChargingCardIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const activeHoldSlotRef = useRef<number | null>(null);
  const completedHoldSlotRef = useRef<number | null>(null);

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
      clearHoldTimer();
    };
  }, []);

  function revealCard(slotIndex: number, isPowerSpin = false) {
    if (isLoading || isRevealing) {
      return;
    }

    const selectedIdsInOtherSlots = new Set(
      revealedCards
        .filter(
          (selectedPokemon, index): selectedPokemon is Pokemon =>
            index !== slotIndex && Boolean(selectedPokemon),
        )
        .map((selectedPokemon) => selectedPokemon.id),
    );
    const currentPokemon = revealedCards[slotIndex];
    const availablePokemon = pokemon.filter(
      (candidate) => !selectedIdsInOtherSlots.has(candidate.id),
    );

    if (availablePokemon.length === 0) {
      setLoadError("No Pokemon are available to draw.");
      return;
    }

    const preferredPokemon = currentPokemon
      ? availablePokemon.filter((candidate) => candidate.id !== currentPokemon.id)
      : availablePokemon;
    const normalSpinPool =
      preferredPokemon.length > 0 ? preferredPokemon : availablePokemon;
    const legendaryPokemon = preferredPokemon.filter(isLegendaryPokemon);
    const hasLegendaryPowerSpinPool = isPowerSpin && legendaryPokemon.length > 0;
    const finalPokemon = pickRandomPokemon(
      hasLegendaryPowerSpinPool ? legendaryPokemon : normalSpinPool,
    );
    const previewPokemon =
      hasLegendaryPowerSpinPool ? legendaryPokemon : availablePokemon;
    setLoadError("");
    setRevealingSlot(slotIndex);

    intervalRef.current = window.setInterval(() => {
      setPreviewBySlot((currentSlots) => {
        const nextSlots = [...currentSlots];
        nextSlots[slotIndex] = pickRandomPokemon(previewPokemon);
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

  function startHold(slotIndex: number) {
    if (isLoading || isRevealing) {
      return;
    }

    clearHoldTimer();
    activeHoldSlotRef.current = slotIndex;
    completedHoldSlotRef.current = null;
    setChargingCardIndex(slotIndex);

    holdTimeoutRef.current = window.setTimeout(() => {
      completedHoldSlotRef.current = slotIndex;
      clearHoldTimer();
      setChargingCardIndex(null);
      revealCard(slotIndex, true);
    }, POWER_SPIN_HOLD_MS);
  }

  function finishHold(slotIndex: number) {
    if (activeHoldSlotRef.current !== slotIndex) {
      return;
    }

    const completedHoldSlot = completedHoldSlotRef.current;
    clearHoldTimer();
    setChargingCardIndex(null);
    activeHoldSlotRef.current = null;

    if (completedHoldSlot === slotIndex) {
      completedHoldSlotRef.current = null;
      return;
    }

    revealCard(slotIndex);
  }

  function cancelHold(slotIndex: number) {
    if (activeHoldSlotRef.current !== slotIndex) {
      return;
    }

    clearHoldTimer();
    setChargingCardIndex(null);
    activeHoldSlotRef.current = null;
    completedHoldSlotRef.current = null;
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

  function clearHoldTimer() {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
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
        <p className="selection-hint">
          Tap a revealed card to re-spin it. Hold a card for Legendary Spin.
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
            isCharging={chargingCardIndex === index}
            isRevealing={revealingSlot === index}
            key={slotPokemon?.id ?? `slot-${index}`}
            onCancelHold={cancelHold}
            onFinishHold={finishHold}
            onReveal={revealCard}
            onStartHold={startHold}
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

function isLegendaryPokemon(pokemon: Pokemon) {
  return LEGENDARY_NAMES.has(pokemon.name);
}
