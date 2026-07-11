"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { BattleSelectionScreen } from "@/components/BattleSelectionScreen";
import { BattleSimulationScreen } from "@/components/BattleSimulationScreen";
import { CardSelectionScreen } from "@/components/CardSelectionScreen";
import { ChampionScreen } from "@/components/ChampionScreen";
import { EliteFourScreen } from "@/components/EliteFourScreen";
import { EndResultsScreen } from "@/components/EndResultsScreen";
import { EvolutionModal } from "@/components/EvolutionModal";
import { GymLeadersScreen } from "@/components/GymLeadersScreen";
import { TrainerCardScreen } from "@/components/TrainerCardScreen";
import { TitleScreen } from "@/components/TitleScreen";
import { getPokemon, scoreTeam } from "@/lib/api";
import { EVOLUTION_TRIGGER_WINS, getNextEvolutionName } from "@/lib/evolutions";
import {
  CHAMPION,
  ELITE_FOUR,
  findBreakdown,
  GYM_LEADERS,
  didBeatOpponent,
  type OpponentMeta,
} from "@/lib/progression";
import type { OpponentBreakdown, Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

const TEAM_SIZE = 6;
type GameMode = "battle" | "adventure";
type GameScreen =
  | "title"
  | "trainer-card"
  | "select-team"
  | "gym-leaders"
  | "elite-four"
  | "champion"
  | "battle-simulation"
  | "end-results";

type BattleSimulationStage = "gym" | "elite-four" | "champion";

type BattleSimulationConfig = {
  stage: BattleSimulationStage;
  opponentIndex: number;
  opponent: OpponentMeta;
  breakdown?: OpponentBreakdown;
};

type PendingEvolution = {
  fromPokemon: Pokemon;
  toPokemon: Pokemon;
  teamIndex: number;
};

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>("title");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [revealedCards, setRevealedCards] = useState<(Pokemon | null)[]>(
    createEmptyCards,
  );
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [activeTeam, setActiveTeam] = useState<Pokemon[]>([]);
  const [pokemonCatalog, setPokemonCatalog] = useState<Pokemon[]>([]);
  const [completedBattleWins, setCompletedBattleWins] = useState(0);
  const [pendingEvolution, setPendingEvolution] = useState<PendingEvolution | null>(null);
  const [result, setResult] = useState<TeamScoreResult | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gymRevealedCount, setGymRevealedCount] = useState(0);
  const [eliteRevealedCount, setEliteRevealedCount] = useState(0);
  const [championRevealed, setChampionRevealed] = useState(false);
  const [battleSimulationConfig, setBattleSimulationConfig] =
    useState<BattleSimulationConfig | null>(null);
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
      const [scoreResult, allPokemon] = await Promise.all([
        scoreTeam(currentTeam.map((pokemon) => pokemon.name)),
        getPokemon(),
      ]);
      setPokemonCatalog(allPokemon);
      setActiveTeam(currentTeam);
      setCompletedBattleWins(0);
      setPendingEvolution(null);
      setResult(scoreResult);
      setGymRevealedCount(0);
      setEliteRevealedCount(0);
      setChampionRevealed(false);
      setBattleSimulationConfig(null);
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
    setActiveTeam([]);
    setCompletedBattleWins(0);
    setPendingEvolution(null);
    setResult(null);
    setError("");
    setGymRevealedCount(0);
    setEliteRevealedCount(0);
    setChampionRevealed(false);
    setBattleSimulationConfig(null);
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

  function startGymBattle(index: number) {
    if (!result) {
      return;
    }

    const opponent = GYM_LEADERS[index];
    setBattleSimulationConfig({
      stage: "gym",
      opponentIndex: index,
      opponent,
      breakdown: findBreakdown(result.opponent_breakdown?.gym_leaders, opponent.name),
    });
    setScreen("battle-simulation");
  }

  function startEliteFourBattle(index: number) {
    if (!result) {
      return;
    }

    const opponent = ELITE_FOUR[index];
    setBattleSimulationConfig({
      stage: "elite-four",
      opponentIndex: index,
      opponent,
      breakdown: findBreakdown(result.opponent_breakdown?.elite_four, opponent.name),
    });
    setScreen("battle-simulation");
  }

  function startChampionBattle() {
    if (!result) {
      return;
    }

    setBattleSimulationConfig({
      stage: "champion",
      opponentIndex: 0,
      opponent: CHAMPION,
      breakdown: findBreakdown(result.opponent_breakdown?.champion, CHAMPION.name),
    });
    setScreen("battle-simulation");
  }

  function completeBattleSimulation() {
    if (!battleSimulationConfig) {
      setScreen("end-results");
      return;
    }

    const didWinBattle = didBeatOpponent(battleSimulationConfig.breakdown);

    if (didWinBattle) {
      const nextCompletedBattleWins = completedBattleWins + 1;
      setCompletedBattleWins(nextCompletedBattleWins);
      queueEvolutionIfNeeded(nextCompletedBattleWins);
    }

    if (battleSimulationConfig.stage === "gym") {
      setGymRevealedCount((currentCount) =>
        Math.max(currentCount, battleSimulationConfig.opponentIndex + 1),
      );
      setScreen("gym-leaders");
      return;
    }

    if (battleSimulationConfig.stage === "elite-four") {
      setEliteRevealedCount((currentCount) =>
        Math.max(currentCount, battleSimulationConfig.opponentIndex + 1),
      );
      setScreen("elite-four");
      return;
    }

    setChampionRevealed(true);
    setScreen("champion");
  }

  function queueEvolutionIfNeeded(nextCompletedBattleWins: number) {
    if (!EVOLUTION_TRIGGER_WINS.has(nextCompletedBattleWins)) {
      return;
    }

    const currentTeam = activeTeam.length > 0 ? activeTeam : team;

    for (let teamIndex = 0; teamIndex < currentTeam.length; teamIndex += 1) {
      const fromPokemon = currentTeam[teamIndex];
      const nextEvolutionName = getNextEvolutionName(fromPokemon.name);

      if (!nextEvolutionName) {
        continue;
      }

      const toPokemon = pokemonCatalog.find(
        (pokemon) => pokemon.name.toLowerCase() === nextEvolutionName.toLowerCase(),
      );

      if (!toPokemon) {
        continue;
      }

      setPendingEvolution({
        fromPokemon,
        toPokemon,
        teamIndex,
      });
      return;
    }
  }

  function completeEvolution() {
    if (!pendingEvolution) {
      return;
    }

    setActiveTeam((currentTeam) => {
      const nextTeam = [...(currentTeam.length > 0 ? currentTeam : team)];
      nextTeam[pendingEvolution.teamIndex] = pendingEvolution.toPokemon;
      return nextTeam;
    });
    setPendingEvolution(null);
  }

  function withEvolutionModal(children: ReactNode) {
    if (!pendingEvolution) {
      return children;
    }

    return (
      <>
        {children}
        <EvolutionModal
          fromPokemon={pendingEvolution.fromPokemon}
          toPokemon={pendingEvolution.toPokemon}
          onComplete={completeEvolution}
        />
      </>
    );
  }

  function getRunTeam() {
    return activeTeam.length > 0 ? activeTeam : team;
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
    return withEvolutionModal(
      <GymLeadersScreen
        result={result}
        revealedCount={gymRevealedCount}
        modeLabel={getModeLabel(gameMode)}
        onBattleLeader={startGymBattle}
        onChallengeEliteFour={() => setScreen("elite-four")}
        onMainMenu={returnToMainMenu}
        onResetRun={resetCurrentRun}
        onSkipBattles={() => setGymRevealedCount(getRevealCountUntilLoss(GYM_LEADERS, result.opponent_breakdown?.gym_leaders))}
        onViewResults={() => setScreen("end-results")}
      />,
    );
  }

  if (screen === "elite-four" && result) {
    return withEvolutionModal(
      <EliteFourScreen
        result={result}
        revealedCount={eliteRevealedCount}
        modeLabel={getModeLabel(gameMode)}
        onBattleEliteMember={startEliteFourBattle}
        onChallengeChampion={() => setScreen("champion")}
        onMainMenu={returnToMainMenu}
        onSkipBattles={() => setEliteRevealedCount(getRevealCountUntilLoss(ELITE_FOUR, result.opponent_breakdown?.elite_four))}
        onViewResults={() => setScreen("end-results")}
      />,
    );
  }

  if (screen === "champion" && result) {
    return withEvolutionModal(
      <ChampionScreen
        trainerProfile={trainerProfile ?? createFallbackTrainerProfile()}
        result={result}
        selectedPokemon={getRunTeam()}
        revealed={championRevealed}
        modeLabel={getModeLabel(gameMode)}
        onBattleChampion={startChampionBattle}
        onMainMenu={returnToMainMenu}
        onSkipBattle={() => setChampionRevealed(true)}
        onViewResults={() => setScreen("end-results")}
      />,
    );
  }

  if (screen === "battle-simulation" && result && battleSimulationConfig) {
    return (
      <BattleSimulationScreen
        trainerProfile={trainerProfile ?? createFallbackTrainerProfile()}
        selectedPokemon={getRunTeam()}
        opponent={battleSimulationConfig.opponent}
        breakdown={battleSimulationConfig.breakdown}
        modeLabel={getModeLabel(gameMode)}
        onComplete={completeBattleSimulation}
        onMainMenu={returnToMainMenu}
      />
    );
  }

  if (screen === "end-results" && result) {
    return (
      <EndResultsScreen
        trainerProfile={trainerProfile ?? createFallbackTrainerProfile()}
        result={result}
        selectedPokemon={getRunTeam()}
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
          selectedPokemon={getRunTeam()}
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
          selectedPokemon={getRunTeam()}
          onMainMenu={returnToMainMenu}
          onRevealCard={revealCard}
          onResetRun={resetCurrentRun}
          onSubmitTeam={submitTeam}
        />
      )}
    </main>
  );
}


function getRevealCountUntilLoss(
  opponents: OpponentMeta[],
  breakdowns: OpponentBreakdown[] | undefined,
) {
  for (let index = 0; index < opponents.length; index += 1) {
    const breakdown = findBreakdown(breakdowns, opponents[index].name);

    if (!breakdown) {
      return index;
    }

    if (!didBeatOpponent(breakdown)) {
      return index + 1;
    }
  }

  return opponents.length;
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
