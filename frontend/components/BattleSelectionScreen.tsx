"use client";

import { useEffect, useRef, useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { PokeballProgress } from "@/components/PokeballProgress";
import { RevealCard } from "@/components/RevealCard";
import { getPokemon } from "@/lib/api";
import type { Pokemon } from "@/types/pokemon";

type BattleSelectionScreenProps = {
  revealedCards: (Pokemon | null)[];
  selectedPokemon: Pokemon[];
  error: string;
  isSubmitting: boolean;
  onMainMenu: () => void;
  onRevealCard: (slotIndex: number, pokemon: Pokemon) => void;
  onResetRun: () => void;
  onSubmitTeam: () => void;
};

const TEAM_SIZE = 6;
const REVEAL_TICK_MS = 85;
const REVEAL_DURATION_MS = 1400;
const LEGENDARY_HOLD_MS = 1300;

const LEGENDARY_NAMES = new Set([
  "Articuno",
  "Zapdos",
  "Moltres",
  "Mewtwo",
  "Mew",
]);

export function BattleSelectionScreen({
  revealedCards,
  selectedPokemon,
  error,
  isSubmitting,
  onMainMenu,
  onRevealCard,
  onSubmitTeam,
}: BattleSelectionScreenProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [previewBySlot, setPreviewBySlot] = useState<(Pokemon | null)[]>(createEmptySlots);
  const [revealingSlots, setRevealingSlots] = useState<Set<number>>(() => new Set());
  const [chargingCardIndex, setChargingCardIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectingRespin, setIsSelectingRespin] = useState(false);
  const [selectedRespinSlots, setSelectedRespinSlots] = useState<Set<number>>(
    () => new Set(),
  );
  const [respinUsed, setRespinUsed] = useState(false);

  const intervalRefs = useRef<Map<number, number>>(new Map());
  const timeoutRefs = useRef<Map<number, number>>(new Map());
  const pendingPokemonBySlotRef = useRef<Map<number, Pokemon>>(new Map());
  const holdTimeoutRef = useRef<number | null>(null);
  const activeHoldSlotRef = useRef<number | null>(null);
  const completedHoldSlotRef = useRef<number | null>(null);

  const teamIsComplete = selectedPokemon.length === TEAM_SIZE;
  const anyCardRevealing = revealingSlots.size > 0;

  useEffect(() => {
    let ignoreResult = false;

    getPokemon()
      .then((loadedPokemon) => {
        if (!ignoreResult) {
          setPokemon(loadedPokemon);
          setLoadError("");
        }
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
      clearAllRevealTimers();
      clearHoldTimer();
    };
  }, []);

  function revealCard(slotIndex: number, isLegendarySpin = false) {
    if (isLoading || revealingSlots.has(slotIndex) || pokemon.length === 0) {
      return;
    }

    const reservedIds = new Set(
      Array.from(pendingPokemonBySlotRef.current.entries())
        .filter(([pendingSlot]) => pendingSlot !== slotIndex)
        .map(([, pendingPokemon]) => pendingPokemon.id),
    );
    const selectedIdsInOtherSlots = new Set(
      revealedCards
        .filter(
          (selected, index): selected is Pokemon =>
            index !== slotIndex && Boolean(selected),
        )
        .map((selected) => selected.id),
    );
    const currentPokemon = revealedCards[slotIndex];
    const availablePokemon = pokemon.filter(
      (candidate) =>
        !selectedIdsInOtherSlots.has(candidate.id) && !reservedIds.has(candidate.id),
    );

    if (availablePokemon.length === 0) {
      setLoadError("No Pokemon are available to draw.");
      return;
    }

    const preferredPokemon = currentPokemon
      ? availablePokemon.filter((candidate) => candidate.id !== currentPokemon.id)
      : availablePokemon;
    const normalSpinPool = preferredPokemon.length > 0 ? preferredPokemon : availablePokemon;
    const legendaryPokemon = preferredPokemon.filter(isLegendaryPokemon);
    const hasLegendaryPool = isLegendarySpin && legendaryPokemon.length > 0;
    const finalPokemon = pickRandomPokemon(
      hasLegendaryPool ? legendaryPokemon : normalSpinPool,
    );
    const previewPokemon = hasLegendaryPool ? legendaryPokemon : availablePokemon;

    pendingPokemonBySlotRef.current.set(slotIndex, finalPokemon);
    setLoadError("");
    setRevealingSlots((currentSlots) => new Set(currentSlots).add(slotIndex));

    const intervalId = window.setInterval(() => {
      setPreviewBySlot((currentSlots) => {
        const nextSlots = [...currentSlots];
        nextSlots[slotIndex] = pickRandomPokemon(previewPokemon);
        return nextSlots;
      });
    }, REVEAL_TICK_MS);
    intervalRefs.current.set(slotIndex, intervalId);

    const timeoutId = window.setTimeout(() => {
      clearRevealTimer(slotIndex);
      setPreviewBySlot((currentSlots) => {
        const nextSlots = [...currentSlots];
        nextSlots[slotIndex] = null;
        return nextSlots;
      });
      setRevealingSlots((currentSlots) => {
        const nextSlots = new Set(currentSlots);
        nextSlots.delete(slotIndex);
        return nextSlots;
      });
      pendingPokemonBySlotRef.current.delete(slotIndex);
      onRevealCard(slotIndex, finalPokemon);
    }, REVEAL_DURATION_MS);
    timeoutRefs.current.set(slotIndex, timeoutId);
  }

  function autoPickTeam() {
    if (isLoading || teamIsComplete || pokemon.length === 0) {
      return;
    }

    clearAllRevealTimers();
    setRevealingSlots(new Set());
    pendingPokemonBySlotRef.current.clear();
    setPreviewBySlot(createEmptySlots());

    const usedIds = new Set(
      revealedCards
        .filter((selected): selected is Pokemon => Boolean(selected))
        .map((selected) => selected.id),
    );
    const availablePokemon = shufflePokemon(
      pokemon.filter((candidate) => !usedIds.has(candidate.id)),
    );
    const emptySlotIndexes = revealedCards
      .map((selected, index) => (selected ? null : index))
      .filter((index): index is number => index !== null);

    emptySlotIndexes.forEach((slotIndex, pickIndex) => {
      const selected = availablePokemon[pickIndex];
      if (selected) {
        onRevealCard(slotIndex, selected);
      }
    });
    setLoadError("");
  }

  function handlePrimaryAction() {
    if (teamIsComplete) {
      onSubmitTeam();
      return;
    }
    autoPickTeam();
  }

  function toggleRespinSlot(slotIndex: number) {
    if (!isSelectingRespin || !revealedCards[slotIndex]) {
      return;
    }

    setSelectedRespinSlots((currentSlots) => {
      const nextSlots = new Set(currentSlots);
      if (nextSlots.has(slotIndex)) {
        nextSlots.delete(slotIndex);
      } else {
        nextSlots.add(slotIndex);
      }
      return nextSlots;
    });
  }

  function handleRespinAction() {
    if (!teamIsComplete || respinUsed || anyCardRevealing) {
      return;
    }

    if (!isSelectingRespin) {
      setIsSelectingRespin(true);
      setSelectedRespinSlots(new Set());
      setLoadError("");
      return;
    }

    if (selectedRespinSlots.size === 0) {
      setLoadError("Select at least one card to re-spin.");
      return;
    }

    const slotsToRespin = Array.from(selectedRespinSlots);
    setIsSelectingRespin(false);
    setSelectedRespinSlots(new Set());
    setRespinUsed(true);
    slotsToRespin.forEach((slotIndex) => revealCard(slotIndex));
  }

  function startHold(slotIndex: number) {
    if (isLoading || revealingSlots.has(slotIndex) || isSelectingRespin) {
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
    }, LEGENDARY_HOLD_MS);
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

  function clearRevealTimer(slotIndex: number) {
    const intervalId = intervalRefs.current.get(slotIndex);
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalRefs.current.delete(slotIndex);
    }
    const timeoutId = timeoutRefs.current.get(slotIndex);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutRefs.current.delete(slotIndex);
    }
  }

  function clearAllRevealTimers() {
    for (const intervalId of intervalRefs.current.values()) {
      window.clearInterval(intervalId);
    }
    for (const timeoutId of timeoutRefs.current.values()) {
      window.clearTimeout(timeoutId);
    }
    intervalRefs.current.clear();
    timeoutRefs.current.clear();
  }

  function clearHoldTimer() {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

  return (
    <section className="selection-screen" aria-label="Arcade Mode team selection">
      <GameTopBar modeLabel="Arcade Mode" onMainMenu={onMainMenu} />

      <div className="selection-header">
        <h1>Choose your Pokemon</h1>
        <p>
          {isSelectingRespin
            ? "Select the cards you want to re-spin, then confirm"
            : "Tap multiple cards to reveal your Pokemon at the same time"}
        </p>
      </div>

      <PokeballProgress count={selectedPokemon.length} label="Revealed Pokemon" />

      <div className="selection-card-toolbar">
        <button
          className={teamIsComplete ? "primary-action auto-pick-action" : "secondary-action auto-pick-action"}
          type="button"
          disabled={
            isLoading ||
            anyCardRevealing ||
            isSelectingRespin ||
            (teamIsComplete && isSubmitting)
          }
          onClick={handlePrimaryAction}
        >
          {teamIsComplete
            ? isSubmitting
              ? "SCORING..."
              : "I CHOOSE YOU!"
            : "AUTO PICK"}
        </button>

        {teamIsComplete && !respinUsed ? (
          <button
            className="secondary-action auto-pick-action"
            type="button"
            disabled={anyCardRevealing || isSubmitting}
            onClick={handleRespinAction}
          >
            {isSelectingRespin ? "CONFIRM RE SPIN" : "RE SPIN"}
          </button>
        ) : null}

        <span className="selection-card-toolbar__hint">
          {isSelectingRespin
            ? `${selectedRespinSlots.size} card${selectedRespinSlots.size === 1 ? "" : "s"} selected`
            : teamIsComplete
              ? respinUsed
                ? "Your one re-spin has been used"
                : "Confirm your team or use your one re-spin"
              : "Instantly reveal every remaining card"}
        </span>
      </div>

      <div className="reveal-grid">
        {revealedCards.map((slotPokemon, index) => {
          const slotIsRevealing = revealingSlots.has(index);
          return (
            <RevealCard
              canReveal={!isLoading && !slotIsRevealing}
              canSelectLocked={isSelectingRespin}
              index={index}
              isCharging={chargingCardIndex === index}
              isRevealing={slotIsRevealing}
              isSelected={selectedRespinSlots.has(index)}
              key={slotPokemon?.id ?? `slot-${index}`}
              onCancelHold={cancelHold}
              onFinishHold={finishHold}
              onReveal={isSelectingRespin ? toggleRespinSlot : revealCard}
              onStartHold={startHold}
              pokemon={slotPokemon}
              previewPokemon={previewBySlot[index]}
            />
          );
        })}
      </div>

      {(loadError || error) && (
        <p className="error-message">{loadError || error}</p>
      )}
    </section>
  );
}

function createEmptySlots() {
  return Array.from({ length: TEAM_SIZE }, () => null);
}

function pickRandomPokemon(pokemon: Pokemon[]) {
  return pokemon[Math.floor(Math.random() * pokemon.length)];
}

function shufflePokemon(pokemon: Pokemon[]) {
  const shuffled = [...pokemon];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function isLegendaryPokemon(pokemon: Pokemon) {
  return Boolean(pokemon.isLegendary) || LEGENDARY_NAMES.has(pokemon.name);
}
