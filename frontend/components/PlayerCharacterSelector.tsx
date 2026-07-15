"use client";

import type { KeyboardEvent } from "react";
import { ProgressionCard } from "@/components/ProgressionCard";
import { getPlayerTrainerSprite, type PlayerTrainerGender } from "@/lib/imagePaths";
import {
  PLAYER_CHARACTERS,
  normalizePlayerCharacterId,
  toPlayerCharacterMeta,
  type PlayerCharacterId,
} from "@/lib/playerCharacters";
import type { TrainerProfile } from "@/types/pokemon";

type PlayerCharacterSelectorProps = {
  selectedCharacterId: PlayerTrainerGender | TrainerProfile["sprite"] | string | null | undefined;
  onChange: (characterId: PlayerCharacterId) => void;
  ariaLabel: string;
  className?: string;
};

export function PlayerCharacterSelector({
  selectedCharacterId,
  onChange,
  ariaLabel,
  className = "",
}: PlayerCharacterSelectorProps) {
  const normalizedId = normalizePlayerCharacterId(selectedCharacterId);
  const selectedIndex = Math.max(
    0,
    PLAYER_CHARACTERS.findIndex((character) => character.id === normalizedId),
  );
  const selectedCharacter = PLAYER_CHARACTERS[selectedIndex];

  function showPreviousCharacter() {
    const previousIndex =
      selectedIndex === 0 ? PLAYER_CHARACTERS.length - 1 : selectedIndex - 1;
    onChange(PLAYER_CHARACTERS[previousIndex].id);
  }

  function showNextCharacter() {
    const nextIndex = (selectedIndex + 1) % PLAYER_CHARACTERS.length;
    onChange(PLAYER_CHARACTERS[nextIndex].id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousCharacter();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextCharacter();
    }
  }

  return (
    <div
      className={`player-character-selector ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <button
        className="sprite-nav-button player-character-selector__control"
        type="button"
        aria-label="Previous player character"
        onClick={showPreviousCharacter}
      >
        {"<"}
      </button>

      <div className="player-character-selector__viewport">
        <ProgressionCard
          className="player-character-card marathon-character-card"
          detailItems={selectedCharacter.detailItems}
          interactionRole="radio"
          isSelectable
          isSelected
          meta={toPlayerCharacterMeta(selectedCharacter, selectedIndex)}
          onSelect={() => onChange(selectedCharacter.id)}
          selectActionLabel="Select"
          spriteSrc={getPlayerTrainerSprite(selectedCharacter.id)}
          status="pending"
        />
        <strong className="player-character-selector__position" aria-live="polite">
          {selectedIndex + 1} / {PLAYER_CHARACTERS.length}
        </strong>
      </div>

      <button
        className="sprite-nav-button player-character-selector__control"
        type="button"
        aria-label="Next player character"
        onClick={showNextCharacter}
      >
        {">"}
      </button>
    </div>
  );
}
