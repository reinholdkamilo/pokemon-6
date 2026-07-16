"use client";

import { useRef } from "react";

type PokeballProgressProps = {
  count: number;
  total?: number;
  label?: string;
  canUseFinalPokeballHold?: boolean;
  onFinalPokeballHold?: () => void;
};

const FINAL_POKEBALL_HOLD_MS = 1300;

export function PokeballProgress({
  count,
  total = 6,
  canUseFinalPokeballHold = false,
  label = "Selected Pokemon",
  onFinalPokeballHold,
}: PokeballProgressProps) {
  const holdTimeoutRef = useRef<number | null>(null);

  function clearHold() {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

  function startFinalPokeballHold() {
    if (!canUseFinalPokeballHold || !onFinalPokeballHold) return;

    clearHold();
    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      onFinalPokeballHold();
    }, FINAL_POKEBALL_HOLD_MS);
  }

  return (
    <div className="team-progress-pokeballs" aria-label={`${label}: ${count} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const isFinalPokeball = index === total - 1 && Boolean(onFinalPokeballHold);
        const className = `team-progress-pokeball${index < count ? " filled" : ""}`;

        if (isFinalPokeball) {
          return (
            <button
              aria-label="Team progress Pokeball 6"
              className={className}
              disabled={!canUseFinalPokeballHold}
              key={index}
              type="button"
              onBlur={clearHold}
              onContextMenu={(event) => event.preventDefault()}
              onPointerCancel={clearHold}
              onPointerDown={startFinalPokeballHold}
              onPointerLeave={clearHold}
              onPointerUp={clearHold}
            />
          );
        }

        return (
          <span
            className={className}
            key={index}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
