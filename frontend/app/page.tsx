"use client";

import { useRef, useState } from "react";
import { BattleSelectionScreen } from "@/components/BattleSelectionScreen";
import { CardSelectionScreen } from "@/components/CardSelectionScreen";
import { ChampionScreen } from "@/components/ChampionScreen";
import { EliteFourScreen } from "@/components/EliteFourScreen";
import { EndResultsScreen } from "@/components/EndResultsScreen";
import { GymLeadersScreen } from "@/components/GymLeadersScreen";
import { TrainerCardScreen } from "@/components/TrainerCardScreen";
import { TitleScreen } from "@/components/TitleScreen";
import { scoreTeam } from "@/lib/api";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

const TEAM_SIZE = 6;
type GameMode = "battle" | "adventure";
type GameScreen =
  | "title"
  | "trainer-card"
  | "select-team"
  | "gym-leaders"
  | "elite-four"
  | "champion"
  | "end-results";

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>("title");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [revealedCards, setRevealedCards] = useState<(Pokemon | null)[]>(
    createEmptyCards,
  );
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [result, setResult] = useState<TeamScoreResult | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [runKey, setRunKey] = useState(0);
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
      setScreen("gym-leaders");
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

  function clearRunState() {
    teamRef.current = [];
    setRevealedCards(createEmptyCards());
    setTeam([]);
    setResult(null);
    setError("");
    setRunKey((currentKey) => currentKey + 1);
  }

  function returnToMainMenu() {
    clearRunState();
    setTrainerProfile(null);
    setGameMode(null);
    setScreen("title");
  }

  function resetCurrentRun() {
    clearRunState();
    if (gameMode === "battle") {
      setTrainerProfile(createBattleTrainerProfile());
    }
    setScreen("select-team");
  }

  function tryAgain() {
    clearRunState();
    if (gameMode === "battle") {
      setTrainerProfile(createBattleTrainerProfile());
      setScreen("select-team");
      return;
    }

    setScreen("select-team");
  }

  function startBattleMode() {
    setGameMode("battle");
    clearRunState();
    setTrainerProfile(createBattleTrainerProfile());
    setScreen("select-team");
  }

  function startAdventureMode() {
    setGameMode("adventure");
    clearRunState();
    setTrainerProfile(null);
    setScreen("trainer-card");
  }

  if (screen === "title") {
    return (
      <TitleScreen
        onSelectAdventureMode={startAdventureMode}
        onSelectBattleMode={startBattleMode}
      />
    );
  }

  if (screen === "trainer-card") {
    return (
      <TrainerCardScreen
        onMainMenu={returnToMainMenu}
        onTrainerSaved={(savedTrainerProfile) => {
          setTrainerProfile(savedTrainerProfile);
          setGameMode("adventure");
          setScreen("select-team");
        }}
      />
    );
  }

  if (screen === "gym-leaders" && result) {
    return (
      <GymLeadersScreen
        result={result}
        modeLabel={getModeLabel(gameMode)}
        onChallengeEliteFour={() => setScreen("elite-four")}
        onMainMenu={returnToMainMenu}
        onResetRun={resetCurrentRun}
        onViewResults={() => setScreen("end-results")}
      />
    );
  }

  if (screen === "elite-four" && result) {
    return (
      <EliteFourScreen
        result={result}
        modeLabel={getModeLabel(gameMode)}
        onChallengeChampion={() => setScreen("champion")}
        onMainMenu={returnToMainMenu}
        onViewResults={() => setScreen("end-results")}
      />
    );
  }

  if (screen === "champion" && result) {
    return (
      <ChampionScreen
        trainerProfile={trainerProfile ?? createFallbackTrainerProfile()}
        result={result}
        selectedPokemon={team}
        modeLabel={getModeLabel(gameMode)}
        onMainMenu={returnToMainMenu}
        onViewResults={() => setScreen("end-results")}
      />
    );
  }

  if (screen === "end-results" && result) {
    return (
      <EndResultsScreen
        trainerProfile={trainerProfile ?? createFallbackTrainerProfile()}
        result={result}
        selectedPokemon={team}
        modeLabel={getModeLabel(gameMode)}
        onMainMenu={returnToMainMenu}
        onTryAgain={tryAgain}
      />
    );
  }

  return (
    <main className="game-shell">
      {gameMode === "battle" ? (
        <BattleSelectionScreen
          key={`battle-${runKey}`}
          error={error}
          revealedCards={revealedCards}
          isSubmitting={isSubmitting}
          selectedPokemon={team}
          onMainMenu={returnToMainMenu}
          onRevealCard={revealCard}
          onResetRun={resetCurrentRun}
          onSubmitTeam={submitTeam}
        />
      ) : (
        <CardSelectionScreen
          key={`adventure-${runKey}`}
          error={error}
          revealedCards={revealedCards}
          isSubmitting={isSubmitting}
          selectedPokemon={team}
          onMainMenu={returnToMainMenu}
          onRevealCard={revealCard}
          onResetRun={resetCurrentRun}
          onSubmitTeam={submitTeam}
        />
      )}
    </main>
  );
}

function createEmptyCards() {
  return Array.from({ length: TEAM_SIZE }, () => null);
}

function createFallbackTrainerProfile(): TrainerProfile {
  return createBattleTrainerProfile();
}

function createBattleTrainerProfile(): TrainerProfile {
  return {
    name: "Battle Trainer",
    dob: "",
    email: "",
    hometown: "Pallet Town",
    sprite: "player-male",
    created_at: "",
  };
}

function getModeLabel(gameMode: GameMode | null) {
  return gameMode === "adventure" ? "Adventure Mode" : "Battle Mode";
}
