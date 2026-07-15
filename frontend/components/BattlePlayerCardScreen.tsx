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

type BattlePlayerCardScreenProps = {
  onMainMenu: () => void;
  onPlayerReady: (trainerProfile: TrainerProfile) => void;
};

export function BattlePlayerCardScreen({
  onMainMenu,
  onPlayerReady,
}: BattlePlayerCardScreenProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<PlayerCharacterId>(
    DEFAULT_PLAYER_CHARACTER_ID,
  );
  const selectedCharacter = getPlayerCharacter(selectedCharacterId);

  function continueToSelection() {
    onPlayerReady({
      name: selectedCharacter.label,
      dob: "",
      email: "",
      hometown: "Pallet Town",
      sprite: selectedCharacter.id,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <main className="game-shell">
      <section className="trainer-card-screen" aria-label="Battle Mode player card">
        <GameTopBar modeLabel="Battle Mode" onMainMenu={onMainMenu} />
        <article className="trainer-profile-card battle-player-card">
          <div className="trainer-card-header">
            <div>
              <p className="eyebrow">Trainer Card</p>
              <h1>{selectedCharacter.label}</h1>
            </div>
            <span className="trainer-card-id">BATTLE</span>
          </div>

          <PlayerCharacterSelector
            ariaLabel="Battle Mode player character"
            className="battle-player-character-selector"
            selectedCharacterId={selectedCharacterId}
            onChange={setSelectedCharacterId}
          />


          <div className="trainer-card-actions">
            <button
              className="primary-action"
              type="button"
              onClick={continueToSelection}
            >
              CONTINUE
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
