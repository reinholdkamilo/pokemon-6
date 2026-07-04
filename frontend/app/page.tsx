"use client";

import { useRef, useState } from "react";
import { CardSelectionScreen } from "@/components/CardSelectionScreen";
import { GymLeaderJourney } from "@/components/GymLeaderJourney";
import { ResultPanel } from "@/components/ResultPanel";
import { TitleScreen } from "@/components/TitleScreen";
import { scoreTeam } from "@/lib/api";
import type { Pokemon, TeamScoreResult } from "@/types/pokemon";

const TEAM_SIZE = 6;
type GameScreen = "title" | "select-team" | "journey";

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>("title");
  const [revealedCards, setRevealedCards] = useState<(Pokemon | null)[]>(
    createEmptyCards,
  );
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [result, setResult] = useState<TeamScoreResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const teamRef = useRef<Pokemon[]>(team);
  teamRef.current = team;

  function revealCard(slotIndex: number, pokemon: Pokemon) {
    setError("");
    setResult(null);

    const nextCards = [...revealedCards];

    if (slotIndex < 0 || slotIndex >= TEAM_SIZE) {
      setError("Choose a valid team card.");
      return;
    }

    const duplicateInAnotherSlot = nextCards.some(
      (selected, index) => index !== slotIndex && selected?.id === pokemon.id,
    );

    if (duplicateInAnotherSlot) {
      setError(`${pokemon.name} is already on your team.`);
      return;
    }

    nextCards[slotIndex] = pokemon;
    const nextTeam = nextCards.filter((card): card is Pokemon => Boolean(card));
    setRevealedCards(nextCards);
    teamRef.current = nextTeam;
    setTeam(nextTeam);
  }

  async function submitTeam() {
    const currentTeam = teamRef.current;

    if (currentTeam.length !== TEAM_SIZE) {
      setError("Reveal all six cards before starting the journey.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const scoreResult = await scoreTeam(currentTeam.map((pokemon) => pokemon.name));
      setResult(scoreResult);
      setScreen("journey");
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
    setRevealedCards(createEmptyCards());
    setTeam([]);
    setResult(null);
    setError("");
    setScreen("title");
  }

  if (screen === "title") {
    return <TitleScreen onStart={() => setScreen("select-team")} />;
  }

  if (screen === "journey" && result) {
    return (
      <main className="game-shell journey-shell">
        <GymLeaderJourney result={result} selectedPokemon={team} onReset={resetTeam} />
        <ResultPanel result={result} />
      </main>
    );
  }

  return (
    <main className="game-shell">
      <CardSelectionScreen
        error={error}
        revealedCards={revealedCards}
        isSubmitting={isSubmitting}
        selectedPokemon={team}
        onRevealCard={revealCard}
        onSubmitTeam={submitTeam}
        onResetRun={resetTeam}
      />
    </main>
  );
}

function createEmptyCards() {
  return Array.from({ length: TEAM_SIZE }, () => null);
}
