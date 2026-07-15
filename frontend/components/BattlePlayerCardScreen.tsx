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
  const [name, setName] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<PlayerCharacterId>(
    DEFAULT_PLAYER_CHARACTER_ID,
  );
  const selectedCharacter = getPlayerCharacter(selectedCharacterId);
  const trimmedName = name.trim();

  function continueToSelection() {
    if (!trimmedName) {
      return;
    }

    onPlayerReady({
      name: trimmedName,
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
              <h1>{trimmedName || "Battle Trainer"}</h1>
            </div>
            <span className="trainer-card-id">BATTLE</span>
          </div>

          <PlayerCharacterSelector
            ariaLabel="Battle Mode player character"
            className="battle-player-character-selector"
            selectedCharacterId={selectedCharacterId}
            onChange={setSelectedCharacterId}
          />

          <div className="trainer-form-grid">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                maxLength={24}
                placeholder="Trainer"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </div>

          <div className="trainer-card-actions">
            <button
              className="primary-action"
              type="button"
              disabled={!trimmedName}
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
