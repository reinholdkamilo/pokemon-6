"use client";

import { useEffect, useRef, useState } from "react";
import { getPokemon } from "@/lib/api";
import { getPokemonCardImagePath } from "@/lib/imagePaths";
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
  onRevealCard: (slotIndex: number, pokemon: Pokemon) => void;
  onSubmitTeam: () => void;
  onResetRun: () => void;
};

const TEAM_SIZE = 6;
const SPIN_TICK_MS = 65;
const SPIN_DURATION_MS = 1200;
const LEGENDARY_HOLD_MS = 1200;

export function CardSelectionScreen({
  selectedPokemon,
  error,
  isSubmitting,
  onRevealCard,
  onSubmitTeam,
  onResetRun,
}: CardSelectionScreenProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isChargingLegendary, setIsChargingLegendary] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [visibleLocation, setVisibleLocation] = useState("Ready to explore Kanto");
  const [pendingEncounter, setPendingEncounter] = useState<Pokemon | null>(null);
  const [isSpecialEncounter, setIsSpecialEncounter] = useState(false);
  const [legendaryNotice, setLegendaryNotice] = useState("");
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
    setIsCatching(false);
    setCatchConfirmed(false);
    setIsSpecialEncounter(isLegendarySpin);
    setLegendaryNotice(isLegendarySpin ? "Legendary Encounter!" : "");
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
        setLegendaryNotice("");
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
        setSelectedLocation("");
        setVisibleLocation(
          selectedPokemon.length + 1 === TEAM_SIZE
            ? "Team complete"
            : "Ready to explore Kanto",
        );
        setLegendaryNotice("");
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
      <div className="selection-header catch-header">
        <p className="eyebrow">Adventure Mode</p>
        <h1>Catch 'em all</h1>
      </div>

      <div className="selection-status">
        <strong>Caught {selectedPokemon.length}/6</strong>
        <span>{isLoading ? "Loading Kanto..." : teamIsComplete ? "Team ready" : "Spin for an area"}</span>
      </div>

      <div className="catch-main">
        {legendaryNotice ? <p className="legendary-encounter-text">{legendaryNotice}</p> : null}
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
          onPointerDown={startHold}
          onPointerUp={finishHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
        >
          {isSpinning ? "Spinning..." : "Spin"}
        </button>
      </div>

      {selectedLocation && !teamIsComplete ? (
        <div className="location-results">
          <h2>{selectedLocation}</h2>
          <p className="encounter-message">You've encountered a Pokemon!</p>
        </div>
      ) : null}

      {selectedPokemon.length > 0 ? (
        <div className="caught-team">
          <h2>{teamIsComplete ? "Completed team" : "Caught team"}</h2>
          <div className="caught-team-grid">
            {selectedPokemon.map((caughtPokemon) => (
              <article className="caught-team-card" key={caughtPokemon.id}>
                <img
                  alt={`${caughtPokemon.name} card`}
                  src={getPokemonCardImagePath(caughtPokemon)}
                />
                <strong>{caughtPokemon.name}</strong>
              </article>
            ))}
          </div>
        </div>
      ) : null}

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

      {pendingEncounter ? (
        <div className="encounter-modal-backdrop" role="presentation">
          <div
            className={`encounter-modal${isSpecialEncounter ? " special" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="encounter-modal-title"
          >
            {isSpecialEncounter ? (
              <p className="legendary-encounter-text">Legendary Encounter!</p>
            ) : null}
            <img
              alt={`${pendingEncounter.name} card`}
              className="encounter-card-image"
              src={getPokemonCardImagePath(pendingEncounter)}
            />
            <h2 id="encounter-modal-title">
              {catchConfirmed ? "Caught!" : "You've encountered a Pokemon!"}
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
