"use client";

import { useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { TrainerProfile } from "@/types/pokemon";

type TrainerCardScreenProps = {
  onMainMenu?: () => void;
  onTrainerSaved: (trainerProfile: TrainerProfile) => void;
};

type CharacterOption = Pick<TrainerProfile, "sprite"> & {
  label: string;
  fallback: string;
};

const CHARACTERS: CharacterOption[] = [
  { sprite: "chaz", label: "Chaz", fallback: "C" },
  { sprite: "laga", label: "Laga", fallback: "L" },
  { sprite: "kevin", label: "Kevin", fallback: "K" },
  { sprite: "gj", label: "GJ", fallback: "GJ" },
];

export function TrainerCardScreen({ onMainMenu, onTrainerSaved }: TrainerCardScreenProps) {
  const [characterIndex, setCharacterIndex] = useState(0);
  const selectedCharacter = CHARACTERS[characterIndex];

  function showPreviousCharacter() {
    setCharacterIndex((current) =>
      current === 0 ? CHARACTERS.length - 1 : current - 1,
    );
  }

  function showNextCharacter() {
    setCharacterIndex((current) => (current + 1) % CHARACTERS.length);
  }

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
    <main className="game-shell">
      <section className="trainer-card-screen" aria-label="Choose your Adventure character">
        {onMainMenu ? (
          <GameTopBar modeLabel="Adventure Mode" onMainMenu={onMainMenu} />
        ) : null}

        <article className="trainer-profile-card">
          <div className="trainer-card-header">
            <div>
              <p className="eyebrow">Player Details</p>
              <h1>Choose Your Character</h1>
            </div>
            <span className="trainer-card-id">BADGES 0</span>
          </div>

          <div className="trainer-sprite-picker" role="radiogroup" aria-label="Adventure character">
            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Previous character"
              onClick={showPreviousCharacter}
            >
              {"<"}
            </button>

            <div
              role="radio"
              aria-checked="true"
              style={{
                display: "flex",
                minWidth: "240px",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <LocalSprite
                alt={selectedCharacter.label}
                className="player-trainer-sprite"
                fallback={selectedCharacter.fallback}
                src={getPlayerTrainerSprite(selectedCharacter.sprite)}
              />
              <strong style={{ fontSize: "1.4rem" }}>{selectedCharacter.label}</strong>
              <span>{characterIndex + 1} / {CHARACTERS.length}</span>
            </div>

            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Next character"
              onClick={showNextCharacter}
            >
              {">"}
            </button>
          </div>

          <div className="trainer-card-actions">
            <button className="primary-action" type="button" onClick={choosePokemon}>
              CHOOSE YOUR POKEMON
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
