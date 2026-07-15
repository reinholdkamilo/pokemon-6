"use client";

import { useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { PlayerCharacterSelector } from "@/components/PlayerCharacterSelector";
import {
  DEFAULT_PLAYER_CHARACTER_ID,
  getPlayerCharacter,
  type PlayerCharacterId,
} from "@/lib/playerCharacters";
import type { TrainerProfile } from "@/types/pokemon";

type TrainerCardScreenProps = {
  onMainMenu?: () => void;
  onTrainerSaved: (trainerProfile: TrainerProfile) => void;
};

export function TrainerCardScreen({ onMainMenu, onTrainerSaved }: TrainerCardScreenProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<PlayerCharacterId>(
    DEFAULT_PLAYER_CHARACTER_ID,
  );
  const selectedCharacter = getPlayerCharacter(selectedCharacterId);

  function choosePokemon() {
    onTrainerSaved({
      name: selectedCharacter.label,
      dob: "",
      email: "",
      hometown: "Pallet Town",
      sprite: selectedCharacter.id,
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
          <GameTopBar modeLabel="Arcade Mode" onMainMenu={onMainMenu} />
        ) : null}

        <div className="stage-hero">
          <p className="eyebrow">Player Details</p>
          <h1>Choose Your Character</h1>
          <p className="trainer-card-instruction">
            Select a trainer card to begin your Arcade Mode run.
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

        <PlayerCharacterSelector
          ariaLabel="Adventure character"
          className="adventure-player-character-selector"
          selectedCharacterId={selectedCharacterId}
          onChange={setSelectedCharacterId}
        />
      </section>
    </main>
  );
}
