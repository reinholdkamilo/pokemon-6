"use client";

import { useMemo, useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { saveTrainerProfile } from "@/lib/api";
import { getPlayerTrainerSprite } from "@/lib/imagePaths";
import type { TrainerProfile } from "@/types/pokemon";

type TrainerCardScreenProps = {
  onMainMenu?: () => void;
  onTrainerSaved: (trainerProfile: TrainerProfile) => void;
};

const HOMETOWNS = [
  "Pallet Town",
  "Viridian City",
  "Pewter City",
  "Cerulean City",
  "Vermilion City",
  "Lavender Town",
  "Celadon City",
  "Fuchsia City",
  "Saffron City",
  "Cinnabar Island",
];

const SPRITES: Array<Pick<TrainerProfile, "sprite"> & { label: string; fallback: string }> = [
  { sprite: "chaz", label: "Chaz", fallback: "C" },
  { sprite: "laga", label: "Laga", fallback: "L" },
  { sprite: "kevin", label: "Kevin", fallback: "K" },
  { sprite: "gj", label: "GJ", fallback: "GJ" },
];

export function TrainerCardScreen({ onMainMenu, onTrainerSaved }: TrainerCardScreenProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [hometown, setHometown] = useState(HOMETOWNS[0]);
  const [spriteIndex, setSpriteIndex] = useState(0);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedSprite = SPRITES[spriteIndex];
  const validationMessage = useMemo(() => {
    if (!name.trim()) {
      return "Enter a trainer name.";
    }
    if (!dob) {
      return "Enter a date of birth.";
    }
    if (!email.trim() || !email.includes("@")) {
      return "Enter an email address containing @.";
    }
    if (!hometown) {
      return "Choose a hometown.";
    }
    return "";
  }, [dob, email, hometown, name]);
  const canSave = !validationMessage && !isSaving;

  async function choosePokemon() {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const trainerProfile: TrainerProfile = {
      name: name.trim(),
      dob,
      email: email.trim(),
      hometown,
      sprite: selectedSprite.sprite,
      created_at: new Date().toISOString(),
    };

    setIsSaving(true);
    setError("");

    try {
      const savedProfile = await saveTrainerProfile(trainerProfile);
      onTrainerSaved(savedProfile);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save trainer profile.",
      );
    } finally {
      setIsSaving(false);
    }
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
      <section className="trainer-card-screen" aria-label="Trainer Card creation">
        {onMainMenu ? (
          <GameTopBar modeLabel="Adventure Mode" onMainMenu={onMainMenu} />
        ) : null}
        <article className="trainer-profile-card">
          <div className="trainer-card-actions">
            <button
              className="primary-action"
              type="button"
              disabled={!canSave}
              onClick={choosePokemon}
            >
              {isSaving ? "SAVING..." : "CHOOSE YOUR POKEMON"}
            </button>
          </div>

          <div className="trainer-card-header">
            <div>
              <p className="eyebrow">Trainer Card</p>
              <h1>{name.trim() || "New Trainer"}</h1>
            </div>
            <span className="trainer-card-id">BADGES 0</span>
          </div>

          <div className="trainer-sprite-picker">
            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Previous trainer character"
              onClick={showPreviousSprite}
            >
              {"<"}
            </button>
            <LocalSprite
              alt={selectedSprite.label}
              className="player-trainer-sprite"
              fallback={selectedSprite.fallback}
              src={getPlayerTrainerSprite(selectedSprite.sprite)}
            />
            <button
              className="sprite-nav-button"
              type="button"
              aria-label="Next trainer character"
              onClick={showNextSprite}
            >
              {">"}
            </button>
            <strong>{selectedSprite.label}</strong>
          </div>

          <div className="trainer-form-grid">
            <label>
              <span>Trainer name</span>
              <input
                type="text"
                value={name}
                maxLength={24}
                placeholder="Trainer"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              <span>Date of birth</span>
              <input
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                placeholder="trainer@example.test"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Hometown</span>
              <select
                value={hometown}
                onChange={(event) => setHometown(event.target.value)}
              >
                {HOMETOWNS.map((town) => (
                  <option key={town} value={town}>
                    {town}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <dl className="trainer-card-stats">
            <div>
              <dt>DOB</dt>
              <dd>{dob || "Required"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{email.trim() || "Required"}</dd>
            </div>
            <div>
              <dt>Hometown</dt>
              <dd>{hometown}</dd>
            </div>
            <div>
              <dt>Pokemon</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Known type</dt>
              <dd>Mixed</dd>
            </div>
          </dl>

          {(error || validationMessage) && (
            <p className="error-message">{error || validationMessage}</p>
          )}
        </article>
      </section>
    </main>
  );
}
