"use client";

import { LocalSprite } from "@/components/LocalSprite";
import { BADGE_IMAGE_PATHS, TRAINER_IMAGE_PATHS } from "@/lib/imagePaths";
import type { Pokemon, TeamScoreResult } from "@/types/pokemon";

type GymLeaderJourneyProps = {
  result: TeamScoreResult;
  selectedPokemon: Pokemon[];
  onReset: () => void;
};

const GYM_LEADERS = [
  {
    name: "Brock",
    number: 1,
    type: "Rock",
    badge: "Boulder Badge",
    pokemonCount: 2,
  },
  {
    name: "Misty",
    number: 2,
    type: "Water",
    badge: "Cascade Badge",
    pokemonCount: 2,
  },
  {
    name: "Lt. Surge",
    number: 3,
    type: "Electric",
    badge: "Thunder Badge",
    pokemonCount: 3,
  },
  {
    name: "Erika",
    number: 4,
    type: "Grass",
    badge: "Rainbow Badge",
    pokemonCount: 4,
  },
  {
    name: "Koga",
    number: 5,
    type: "Poison",
    badge: "Soul Badge",
    pokemonCount: 4,
  },
  {
    name: "Sabrina",
    number: 6,
    type: "Psychic",
    badge: "Marsh Badge",
    pokemonCount: 4,
  },
  {
    name: "Blaine",
    number: 7,
    type: "Fire",
    badge: "Volcano Badge",
    pokemonCount: 4,
  },
  {
    name: "Giovanni",
    number: 8,
    type: "Ground",
    badge: "Earth Badge",
    pokemonCount: 5,
  },
];

export function GymLeaderJourney({
  result,
  selectedPokemon,
  onReset,
}: GymLeaderJourneyProps) {
  const earnedBadges = new Set(result.badges_earned ?? []);
  const resultText = result.result || "Journey result";

  return (
    <section className="gym-journey" aria-label="Gym Leader journey">
      <div className="journey-hero">
        <div>
          <p className="eyebrow">Kanto badge journey</p>
          <h1>Gym Leader Cards</h1>
          <p>{resultText}</p>
        </div>
        <button className="secondary-action reset-journey" type="button" onClick={onReset}>
          RESET RUN
        </button>
      </div>

      <div className="journey-team-strip" aria-label="Selected team">
        {selectedPokemon.map((pokemon) => (
          <span className={`team-chip type-${pokemon.primary_type.toLowerCase()}`} key={pokemon.id}>
            {pokemon.name}
          </span>
        ))}
      </div>

      <div className="gym-card-grid">
        {GYM_LEADERS.map((leader) => {
          const isCleared = earnedBadges.has(leader.badge);

          return (
            <article
              className={`gym-card type-${leader.type.toLowerCase()} ${
                isCleared ? "cleared" : "failed"
              }`}
              key={leader.badge}
            >
              <div className="gym-card-top">
                <span>GYM {leader.number}</span>
                <strong>{isCleared ? "CLEARED" : "FAILED"}</strong>
              </div>
              <LocalSprite
                alt={`${leader.name} sprite`}
                className="trainer-sprite gym-trainer-sprite"
                fallback={getInitials(leader.name)}
                src={TRAINER_IMAGE_PATHS[leader.name]}
              />
              <h2>{leader.name}</h2>
              <p>{leader.type} specialist</p>
              <div className="gym-badge-row">
                <LocalSprite
                  alt={`${leader.badge} sprite`}
                  className="mini-badge-sprite"
                  fallback={String(leader.number)}
                  src={BADGE_IMAGE_PATHS[leader.badge]}
                />
                <span>{leader.badge}</span>
              </div>
              <div className="pokeball-row" aria-label={`${leader.pokemonCount} Pokemon`}>
                {Array.from({ length: leader.pokemonCount }, (_, index) => (
                  <span className="pokeball-dot" key={index} aria-hidden="true" />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .replace(".", "")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
