"use client";

import { useState } from "react";
import { PokemonCard } from "@/components/PokemonCard";
import { PokemonSearch } from "@/components/PokemonSearch";
import { ResultPanel } from "@/components/ResultPanel";
import { TeamSlots } from "@/components/TeamSlots";
import { scoreTeam } from "@/lib/api";
import type { Pokemon, TeamScoreResult } from "@/types/pokemon";

const TEAM_SIZE = 6;

export default function Home() {
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [result, setResult] = useState<TeamScoreResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addPokemon(pokemon: Pokemon) {
    setError("");

    if (team.length >= TEAM_SIZE) {
      setError("Your team already has six Pokemon.");
      return;
    }

    if (team.some((selected) => selected.id === pokemon.id)) {
      setError(`${pokemon.name} is already on your team.`);
      return;
    }

    setTeam((currentTeam) => [...currentTeam, pokemon]);
    setResult(null);
  }

  function removePokemon(pokemonId: number) {
    setTeam((currentTeam) =>
      currentTeam.filter((pokemon) => pokemon.id !== pokemonId),
    );
    setResult(null);
    setError("");
  }

  async function submitTeam() {
    if (team.length !== TEAM_SIZE) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const scoreResult = await scoreTeam(team.map((pokemon) => pokemon.name));
      setResult(scoreResult);
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to score this team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="intro">
        <p className="eyebrow">Generation 1 team challenge</p>
        <h1>Pokemon 6</h1>
        <p>
          Build a balanced team of six Generation 1 Pokemon, submit it to the
          MVP scoring system, and see whether it can clear the Champion run.
        </p>
      </section>

      <section className="workspace" aria-label="Team builder">
        <div className="builder-column">
          <PokemonSearch onSelectPokemon={addPokemon} selectedPokemon={team} />
        </div>

        <div className="team-column">
          <TeamSlots pokemon={team} onRemovePokemon={removePokemon} />

          {team.length > 0 && (
            <section className="selected-details" aria-label="Selected Pokemon details">
              <h2>Selected Pokemon</h2>
              <div className="card-grid">
                {team.map((pokemon) => (
                  <PokemonCard key={pokemon.id} pokemon={pokemon} />
                ))}
              </div>
            </section>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            className="submit-button"
            type="button"
            disabled={team.length !== TEAM_SIZE || isSubmitting}
            onClick={submitTeam}
          >
            {isSubmitting ? "Scoring Team..." : "Submit Team"}
          </button>

          <ResultPanel result={result} />
        </div>
      </section>
    </main>
  );
}
