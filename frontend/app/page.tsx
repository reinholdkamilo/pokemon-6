"use client";

import { useRef, useState } from "react";
import { PokemonCard } from "@/components/PokemonCard";
import { PokemonSearch } from "@/components/PokemonSearch";
import { ResultPanel } from "@/components/ResultPanel";
import { SpinSelector } from "@/components/SpinSelector";
import { TeamSlots } from "@/components/TeamSlots";
import { scoreTeam } from "@/lib/api";
import type { Pokemon, TeamScoreResult } from "@/types/pokemon";

const TEAM_SIZE = 6;

export default function Home() {
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [result, setResult] = useState<TeamScoreResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const teamRef = useRef<Pokemon[]>(team);
  teamRef.current = team;

  function addPokemon(pokemon: Pokemon) {
    const currentTeam = teamRef.current;
    setError("");

    if (currentTeam.length >= TEAM_SIZE) {
      setError("Your team already has six Pokemon.");
      return;
    }

    if (currentTeam.some((selected) => selected.id === pokemon.id)) {
      setError(`${pokemon.name} is already on your team.`);
      return;
    }

    const nextTeam = [...currentTeam, pokemon];
    teamRef.current = nextTeam;
    setTeam(nextTeam);
    setResult(null);
  }

  function removePokemon(pokemonId: number) {
    const nextTeam = teamRef.current.filter((pokemon) => pokemon.id !== pokemonId);
    teamRef.current = nextTeam;
    setTeam(nextTeam);
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

  function resetTeam() {
    teamRef.current = [];
    setTeam([]);
    setResult(null);
    setError("");
  }

  return (
    <main className="page-shell">
      <section className="intro">
        <p className="eyebrow">Generation 1 team challenge</p>
        <h1>Pokemon 6</h1>
        <p>
          Spin for six random Generation 1 Pokemon, submit the team to the MVP
          scoring system, and see whether it can clear the Champion run.
        </p>
      </section>

      <section className="game-flow" aria-label="Team spinner">
        <SpinSelector selectedPokemon={team} onAddPokemon={addPokemon} />

        <div className="team-column">
          <TeamSlots pokemon={team} onRemovePokemon={removePokemon} />

          <button
            className="secondary-button reset-button"
            type="button"
            disabled={team.length === 0 && !result}
            onClick={resetTeam}
          >
            Reset Team
          </button>

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

      <section className="debug-search" aria-label="Secondary Pokemon search">
        <PokemonSearch onSelectPokemon={addPokemon} selectedPokemon={team} />
      </section>
    </main>
  );
}
