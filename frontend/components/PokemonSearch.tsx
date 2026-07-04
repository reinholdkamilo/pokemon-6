"use client";

import { FormEvent, useEffect, useState } from "react";
import { getPokemon, searchPokemon } from "@/lib/api";
import type { Pokemon } from "@/types/pokemon";

type PokemonSearchProps = {
  onSelectPokemon: (pokemon: Pokemon) => void;
  selectedPokemon: Pokemon[];
};

export function PokemonSearch({
  onSelectPokemon,
  selectedPokemon,
}: PokemonSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignoreResult = false;
    const searchDelay = query.trim() ? 250 : 0;

    const timeoutId = window.setTimeout(() => {
      loadPokemon(query)
        .then((pokemon) => {
          if (!ignoreResult) {
            setResults(pokemon);
            setError("");
          }
        })
        .catch((caughtError) => {
          if (!ignoreResult) {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Unable to load Pokemon.",
            );
          }
        })
        .finally(() => {
          if (!ignoreResult) {
            setIsLoading(false);
          }
        });

      setIsLoading(true);
    }, searchDelay);

    return () => {
      ignoreResult = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const pokemon = await loadPokemon(query);
      setResults(pokemon);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to search Pokemon.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPokemon(searchQuery: string) {
    const trimmedQuery = searchQuery.trim();
    return trimmedQuery ? searchPokemon(trimmedQuery) : getPokemon();
  }

  const selectedIds = new Set(selectedPokemon.map((pokemon) => pokemon.id));
  const teamIsFull = selectedPokemon.length >= 6;

  return (
    <section className="panel" aria-label="Pokemon search">
      <h2>Pokemon Search</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="search"
          placeholder="Search by name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Pokemon name"
        />
        <button className="secondary-button" type="submit">
          Search
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="muted">Loading Pokemon...</p>}

      {!isLoading && !error && (
        <div className="search-results">
          {results.map((pokemon) => {
            const isSelected = selectedIds.has(pokemon.id);
            const isDisabled = isSelected || teamIsFull;
            return (
              <button
                className="result-button"
                type="button"
                key={pokemon.id}
                disabled={isDisabled}
                onClick={() => onSelectPokemon(pokemon)}
              >
                <span>
                  <span className="pokemon-name">{pokemon.name}</span>
                  <br />
                  <span className="pokemon-types">
                    {formatTypes(pokemon)} | BST {pokemon.base_stat_total}
                  </span>
                </span>
                <span>
                  {isSelected ? "Added" : teamIsFull ? "Team Full" : "Add"}
                </span>
              </button>
            );
          })}
          {results.length === 0 && <p className="muted">No Pokemon found.</p>}
        </div>
      )}
    </section>
  );
}

function formatTypes(pokemon: Pokemon) {
  return [pokemon.primary_type, pokemon.secondary_type].filter(Boolean).join(" / ");
}
