"use client";

import { useEffect, useRef, useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { PokeballProgress } from "@/components/PokeballProgress";
import { getPokemon } from "@/lib/api";
import {
  KANTO_LOCATIONS,
  getAvailableLocations,
  getEligiblePokemonForLocation,
  getLegendaryEncounterForLocation,
  getMissingEncounterPokemonIds,
  spinLegendaryLocation,
  spinLocation,
} from "@/lib/kantoEncounters";
import type { Pokemon } from "@/types/pokemon";

type CardSelectionScreenProps = {
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
const SPIN_TICK_MS = 65;
const SPIN_DURATION_MS = 1200;
const LEGENDARY_HOLD_MS = 1200;

export function CardSelectionScreen({
  revealedCards,
  selectedPokemon,
  error,
  isSubmitting,
  onMainMenu,
  onRevealCard,
  onResetRun,
  onSubmitTeam,
}: CardSelectionScreenProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isChargingLegendary, setIsChargingLegendary] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [visibleLocation, setVisibleLocation] = useState("Ready to explore Kanto");
  const [pendingEncounter, setPendingEncounter] = useState<Pokemon | null>(null);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isSpecialEncounter, setIsSpecialEncounter] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [catchConfirmed, setCatchConfirmed] = useState(false);
  const spinIntervalRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const catchTimeoutRef = useRef<number | null>(null);
  const catchCompleteTimeoutRef = useRef<number | null>(null);
  const holdCompletedRef = useRef(false);

  const teamIsComplete = selectedPokemon.length === TEAM_SIZE;
  const activeError = loadError || error;

  useEffect(() => {
    let ignoreResult = false;

    getPokemon()
      .then((loadedPokemon) => {
        if (ignoreResult) {
          return;
        }

        setPokemon(loadedPokemon);
        setLoadError("");
        validateEncounterCoverage();
      })
      .catch((caughtError) => {
        if (!ignoreResult) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load Pokemon encounters.",
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
      clearHoldTimer();
      clearCatchTimers();
    };
  }, []);

  function startSpin(isLegendarySpin = false) {
    if (isLoading || isSpinning || teamIsComplete || pokemon.length === 0) {
      return;
    }

    clearSpinTimers();
    clearCatchTimers();
    setLoadError("");
    setPendingEncounter(null);
    setIsEncounterModalOpen(false);
    setIsCatching(false);
    setCatchConfirmed(false);
    setIsSpecialEncounter(isLegendarySpin);
    setIsSpinning(true);

    const finalLocation = isLegendarySpin
      ? spinLegendaryLocation(selectedPokemon, pokemon)
      : spinLocation(selectedPokemon, pokemon);
    const spinnerLocations =
      selectedPokemon.length === 0 ? KANTO_LOCATIONS : getAvailableLocations(selectedPokemon, pokemon);

    spinIntervalRef.current = window.setInterval(() => {
      setVisibleLocation(
        spinnerLocations[Math.floor(Math.random() * spinnerLocations.length)],
      );
    }, SPIN_TICK_MS);

    spinTimeoutRef.current = window.setTimeout(() => {
      clearSpinTimers();
      setIsSpinning(false);

      const nextEncounter = chooseEncounterForLocation(
        finalLocation,
        isLegendarySpin,
      );

      if (!nextEncounter) {
        setSelectedLocation("");
        setVisibleLocation("Ready to explore Kanto");
        setLoadError("No uncaught Pokemon are available. Reset the run to start again.");
        setIsSpecialEncounter(false);
        return;
      }

      setSelectedLocation(nextEncounter.location);
      setVisibleLocation(nextEncounter.location);
      setPendingEncounter(nextEncounter.pokemon);
      setIsSpecialEncounter(
        isLegendarySpin || isLegendaryPokemon(nextEncounter.pokemon),
      );
    }, SPIN_DURATION_MS);
  }

  function startHold() {
    if (isLoading || isSpinning || teamIsComplete) {
      return;
    }

    clearHoldTimer();
    holdCompletedRef.current = false;
    setIsChargingLegendary(true);

    holdTimeoutRef.current = window.setTimeout(() => {
      holdCompletedRef.current = true;
      clearHoldTimer();
      setIsChargingLegendary(false);
      startSpin(true);
    }, LEGENDARY_HOLD_MS);
  }

  function finishHold() {
    clearHoldTimer();
    setIsChargingLegendary(false);

    if (holdCompletedRef.current) {
      holdCompletedRef.current = false;
      return;
    }

    startSpin(false);
  }

  function cancelHold() {
    clearHoldTimer();
    holdCompletedRef.current = false;
    setIsChargingLegendary(false);
  }

  function catchPokemon() {
    if (!pendingEncounter || teamIsComplete || isCatching) {
      return;
    }

    if (selectedPokemon.some((pokemon) => pokemon.id === pendingEncounter.id)) {
      setLoadError(`${pendingEncounter.name} is already on your team.`);
      setPendingEncounter(null);
      return;
    }

    const caughtPokemon = pendingEncounter;
    setIsCatching(true);
    setCatchConfirmed(false);

    catchTimeoutRef.current = window.setTimeout(() => {
      setCatchConfirmed(true);

      catchCompleteTimeoutRef.current = window.setTimeout(() => {
        onRevealCard(selectedPokemon.length, caughtPokemon);
        setPendingEncounter(null);
        setIsEncounterModalOpen(false);
        setSelectedLocation("");
        setVisibleLocation(
          selectedPokemon.length + 1 === TEAM_SIZE
            ? "Team complete"
            : "Ready to explore Kanto",
        );
        setIsSpecialEncounter(false);
        setIsCatching(false);
        setCatchConfirmed(false);
      }, 650);
    }, 950);
  }

  function chooseEncounterForLocation(location: string, isLegendarySpin: boolean) {
    const specialPokemon = isLegendarySpin
      ? getLegendaryEncounterForLocation(location, selectedPokemon, pokemon)
      : null;
    const eligiblePokemon = specialPokemon
      ? [specialPokemon]
      : getEligiblePokemonForLocation(location, selectedPokemon, pokemon);

    if (eligiblePokemon.length > 0) {
      return {
        location,
        pokemon: pickRandomPokemon(eligiblePokemon),
      };
    }

    const fallbackLocation = getAvailableLocations(selectedPokemon, pokemon).find(
      (availableLocation) =>
        getEligiblePokemonForLocation(availableLocation, selectedPokemon, pokemon).length >
        0,
    );

    if (!fallbackLocation) {
      return null;
    }

    const fallbackPokemon = getEligiblePokemonForLocation(
      fallbackLocation,
      selectedPokemon,
      pokemon,
    );

    return {
      location: fallbackLocation,
      pokemon: pickRandomPokemon(fallbackPokemon),
    };
  }

  function clearSpinTimers() {
    if (spinIntervalRef.current !== null) {
      window.clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }
  }

  function clearHoldTimer() {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

  function clearCatchTimers() {
    if (catchTimeoutRef.current !== null) {
      window.clearTimeout(catchTimeoutRef.current);
      catchTimeoutRef.current = null;
    }

    if (catchCompleteTimeoutRef.current !== null) {
      window.clearTimeout(catchCompleteTimeoutRef.current);
      catchCompleteTimeoutRef.current = null;
    }
  }

  return (
    <section className="selection-screen catch-selection" aria-label="Kanto catch selection">
      <GameTopBar modeLabel="Adventure Mode" onMainMenu={onMainMenu} />
      <div className="selection-header">
        <h1>Choose your Pokemon</h1>
        <p>Tap each card to reveal your Pokemon team</p>
      </div>

      <PokeballProgress count={selectedPokemon.length} label="Caught Pokemon" />

      <div className="catch-main">
        <div
          className={`location-spinner${isSpinning ? " spinning" : ""}${
            isChargingLegendary || isSpecialEncounter ? " legendary" : ""
          }`}
          aria-live="polite"
        >
          {visibleLocation}
        </div>
        <button
          className={`spin-button${isChargingLegendary ? " charging" : ""}`}
          type="button"
          disabled={isLoading || isSpinning || teamIsComplete}
          onPointerDown={() => {
            if (!pendingEncounter) {
              startHold();
            }
          }}
          onPointerUp={() => {
            if (!pendingEncounter) {
              finishHold();
            }
          }}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onClick={(event) => {
            if (pendingEncounter) {
              setIsEncounterModalOpen(true);
              return;
            }

            if (event.detail === 0) {
              startSpin(false);
            }
          }}
        >
          {isSpinning
            ? "Spinning..."
            : pendingEncounter
              ? "You've encountered a Pokemon"
              : "Spin"}
        </button>
      </div>

      {selectedLocation && !teamIsComplete ? (
        <div className="location-results">
          <h2>{selectedLocation}</h2>
        </div>
      ) : null}

      <div className="reveal-grid adventure-card-grid">
        {revealedCards.map((slotPokemon, index) => (
          <div
            className={[
              "adventure-card-slot",
              "mystery-reveal-card",
              slotPokemon ? "filled" : "empty",
              slotPokemon ? `type-${slotPokemon.primary_type.toLowerCase()}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={slotPokemon?.id ?? `slot-${index}`}
          >
            {slotPokemon ? (
              <span className="mystery-card-revealed">
                {slotPokemon.image ? (
                  <img
                    alt={slotPokemon.name}
                    className="pokemon-sprite mystery-card-sprite"
                    src={slotPokemon.image}
                  />
                ) : (
                  <span className="sprite-fallback">?</span>
                )}
                <strong className="mystery-card-name">{slotPokemon.name}</strong>
                <span className="mystery-card-types">
                  {slotPokemon.primary_type}
                  {slotPokemon.secondary_type ? ` / ${slotPokemon.secondary_type}` : ""}
                </span>
                <span className="mystery-card-stat">
                  BST {slotPokemon.base_stat_total}
                </span>
              </span>
            ) : (
              <span className="mystery-card-template" aria-hidden="true">
                <span className="mystery-question">?</span>
                <span className="mystery-label">Mystery Pokémon</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {activeError ? <p className="error-message">{activeError}</p> : null}

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
          disabled={isSpinning}
          onClick={onResetRun}
        >
          RESET RUN
        </button>
      </div>

      {pendingEncounter && isEncounterModalOpen ? (
        <div className="encounter-modal-backdrop" role="presentation">
          <div
            className={`encounter-modal${isSpecialEncounter ? " special" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="encounter-modal-title"
          >
            <div className="encounter-sprite-card">
              {pendingEncounter.image ? (
                <img
                  alt={pendingEncounter.name}
                  className="pokemon-sprite encounter-pokemon-sprite"
                  src={pendingEncounter.image}
                />
              ) : (
                <span className="sprite-fallback">?</span>
              )}
              <strong className="mystery-card-name">{pendingEncounter.name}</strong>
              <span className="mystery-card-types">
                {pendingEncounter.primary_type}
                {pendingEncounter.secondary_type ? ` / ${pendingEncounter.secondary_type}` : ""}
              </span>
              <span className="mystery-card-stat">
                BST {pendingEncounter.base_stat_total}
              </span>
            </div>
            <h2 id="encounter-modal-title">
              {catchConfirmed ? "Caught!" : getEncounterText(pendingEncounter)}
            </h2>
            <div
              className={`poke-ball-catch${isCatching ? " catching" : ""}${
                catchConfirmed ? " caught" : ""
              }`}
              aria-hidden="true"
            >
              <span />
            </div>
            <div className="encounter-modal-actions">
              <button
                className="primary-action"
                type="button"
                disabled={isCatching}
                onClick={catchPokemon}
              >
                {isCatching ? "CATCHING..." : "Catch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getEncounterText(pokemon: Pokemon) {
  return isLegendaryPokemon(pokemon)
    ? `${pokemon.name} has appeared`
    : `A wild ${pokemon.name} has appeared`;
}

function validateEncounterCoverage() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const missingPokemonIds = getMissingEncounterPokemonIds();

  if (missingPokemonIds.length > 0) {
    console.warn(
      `Kanto encounter map is missing Pokemon ids: ${missingPokemonIds.join(", ")}`,
    );
  }
}

function pickRandomPokemon(pokemon: Pokemon[]) {
  return pokemon[Math.floor(Math.random() * pokemon.length)];
}

function isLegendaryPokemon(pokemon: Pokemon) {
  return [144, 145, 146, 150, 151].includes(pokemon.id) || Boolean(pokemon.isLegendary);
}
