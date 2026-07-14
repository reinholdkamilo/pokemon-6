"use client";

import { useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { ProgressionCard } from "@/components/ProgressionCard";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { OpponentMeta } from "@/lib/progression";
import type { TrainerProfile } from "@/types/pokemon";

type TrainerCardScreenProps = {
  onMainMenu?: () => void;
  onTrainerSaved: (trainerProfile: TrainerProfile) => void;
};

type CharacterOption = Pick<TrainerProfile, "sprite"> & {
  label: string;
  fallback: string;
  detailItems: string[];
};

const CHARACTERS: CharacterOption[] = [
  {
    sprite: "chaz",
    label: "Chaz",
    fallback: "C",
    detailItems: ["Pallet Town", "Badges 0"],
  },
  {
    sprite: "laga",
    label: "Laga",
    fallback: "L",
    detailItems: ["Pallet Town", "Badges 0"],
  },
  {
    sprite: "kevin",
    label: "Kevin",
    fallback: "K",
    detailItems: ["Pallet Town", "Badges 0"],
  },
  {
    sprite: "gj",
    label: "GJ",
    fallback: "GJ",
    detailItems: ["Pallet Town", "Badges 0"],
  },
];

export function TrainerCardScreen({ onMainMenu, onTrainerSaved }: TrainerCardScreenProps) {
  const [characterIndex, setCharacterIndex] = useState(0);
  const selectedCharacter = CHARACTERS[characterIndex];

  function choosePokemon() {
    onTrainerSaved({
      name: selectedCharacter.label,
      dob: "",
      email: "",
      hometown: "Pallet Town",
      sprite: selectedCharacter.sprite,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <main className="game-shell stage-shell">
      <section
        className="stage-screen trainer-card-screen"
        aria-label="Choose your Adventure character"
      >
        {onMainMenu ? (
          <GameTopBar modeLabel="Adventure Mode" onMainMenu={onMainMenu} />
        ) : null}

        <div className="stage-hero">
          <p className="eyebrow">Player Details</p>
          <h1>Choose Your Character</h1>
          <p className="trainer-card-instruction">
            Select a trainer card to begin your Adventure Mode run.
          </p>
        </div>

        <div className="battle-choice-panel trainer-card-actions">
          <button
            className="primary-action stage-action"
            type="button"
            onClick={choosePokemon}
          >
            CHOOSE YOUR POKEMON
          </button>
        </div>

        <div
          className="stage-card-grid gym-stage-grid player-character-grid"
          role="radiogroup"
          aria-label="Adventure character"
        >
          {CHARACTERS.map((character, index) => (
            <ProgressionCard
              className="player-character-card"
              detailItems={character.detailItems}
              interactionRole="radio"
              isSelectable
              isSelected={index === characterIndex}
              key={character.sprite}
              meta={toCharacterMeta(character, index)}
              onSelect={() => setCharacterIndex(index)}
              selectActionLabel="Select"
              spriteSrc={getPlayerTrainerSprite(character.sprite)}
              status="pending"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function toCharacterMeta(character: CharacterOption, index: number): OpponentMeta {
  return {
    name: character.label,
    stage: `Character ${index + 1}`,
    number: index + 1,
    specialty: "Adventure",
    pokemonCount: 0,
    pokemonTeam: character.detailItems,
    fallback: character.fallback,
  };
}
