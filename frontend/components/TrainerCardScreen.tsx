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

const portraitFrameStyle = {
  width: "min(210px, 58vw)",
  height: "300px",
  maxWidth: "100%",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  border: "3px solid rgba(52, 42, 32, 0.52)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.76)",
} as const;

const portraitStyle = {
  display: "block",
  width: "100%",
  height: "100%",
  minHeight: 0,
  maxWidth: "100%",
  maxHeight: "100%",
  border: 0,
  borderRadius: 0,
  background: "transparent",
  padding: "8px 10px 4px",
  objectFit: "contain",
  objectPosition: "center bottom",
  transform: "none",
  imageRendering: "pixelated",
} as const;

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
              <div style={portraitFrameStyle}>
                <LocalSprite
                  key={selectedCharacter.sprite}
                  alt={selectedCharacter.label}
                  className="player-trainer-sprite"
                  fallback={selectedCharacter.fallback}
                  src={getPlayerTrainerSprite(selectedCharacter.sprite)}
                  style={portraitStyle}
                />
              </div>
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
