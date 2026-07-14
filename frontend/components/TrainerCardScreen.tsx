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
  const [selectedSprite, setSelectedSprite] = useState<TrainerProfile["sprite"]>("chaz");

  const selectedCharacter =
    CHARACTERS.find((character) => character.sprite === selectedSprite) ?? CHARACTERS[0];

  function choosePokemon() {
    const trainerProfile: TrainerProfile = {
      name: selectedCharacter.label,
      dob: "",
      email: "",
      hometown: "Pallet Town",
      sprite: selectedCharacter.sprite,
      created_at: new Date().toISOString(),
    };

    onTrainerSaved(trainerProfile);
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

          <div
            role="radiogroup"
            aria-label="Adventure character"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              margin: "28px 0",
            }}
          >
            {CHARACTERS.map((character) => {
              const isSelected = character.sprite === selectedSprite;

              return (
                <button
                  key={character.sprite}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSprite(character.sprite)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    padding: "18px",
                    borderRadius: "18px",
                    border: isSelected ? "3px solid #ffd43b" : "2px solid rgba(255,255,255,0.2)",
                    background: isSelected ? "rgba(255,212,59,0.14)" : "rgba(255,255,255,0.06)",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <LocalSprite
                    alt={character.label}
                    className="player-trainer-sprite"
                    fallback={character.fallback}
                    src={getPlayerTrainerSprite(character.sprite)}
                  />
                  <strong>{character.label}</strong>
                </button>
              );
            })}
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
