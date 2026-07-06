"use client";

import { useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { TrainerProfile } from "@/types/pokemon";

type BattlePlayerCardScreenProps = {
  onMainMenu: () => void;
  onPlayerReady: (trainerProfile: TrainerProfile) => void;
};

const SPRITES: Array<Pick<TrainerProfile, "sprite"> & { label: string }> = [
  { sprite: "player-male", label: "Male trainer" },
  { sprite: "player-female", label: "Female trainer" },
];

export function BattlePlayerCardScreen({
  onMainMenu,
  onPlayerReady,
}: BattlePlayerCardScreenProps) {
  const [name, setName] = useState("");
  const [spriteIndex, setSpriteIndex] = useState(0);
  const selectedSprite = SPRITES[spriteIndex];
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
      sprite: selectedSprite.sprite,
      created_at: new Date().toISOString(),
    });
  }

  function showPreviousSprite() {
    setSpriteIndex((currentIndex) =>
      currentIndex === 0 ? SPRITES.length - 1 : currentIndex - 1,
    );
  }

  function showNextSprite() {
    setSpriteIndex((currentIndex) => (currentIndex + 1) % SPRITES.length);
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

          <div className="trainer-sprite-picker">
            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Previous trainer sprite"
              onClick={showPreviousSprite}
            >
              {"<"}
            </button>
            <LocalSprite
              alt={selectedSprite.label}
              className="player-trainer-sprite"
              fallback={selectedSprite.sprite === "player-male" ? "M" : "F"}
              src={getPlayerTrainerSprite(selectedSprite.sprite)}
            />
            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Next trainer sprite"
              onClick={showNextSprite}
            >
              {">"}
            </button>
            <strong>{selectedSprite.label}</strong>
          </div>

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
