"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BattleSelectionScreen } from "@/components/BattleSelectionScreen";
import { BattleSimulationScreen } from "@/components/BattleSimulationScreen";
import { ChampionScreen } from "@/components/ChampionScreen";
import { EliteFourScreen } from "@/components/EliteFourScreen";
import { EndResultsScreen } from "@/components/EndResultsScreen";
import { EvolutionModal } from "@/components/EvolutionModal";
import { GymLeadersScreen } from "@/components/GymLeadersScreen";
import { BattlePlayerCardScreen } from "@/components/BattlePlayerCardScreen";
import { TitleScreen } from "@/components/TitleScreen";
import { getPokemon, scoreTeam } from "@/lib/api";
import { EVOLUTION_TRIGGER_WINS, getNextEvolutionName } from "@/lib/evolutions";
import { DEFAULT_PLAYER_CHARACTER_ID } from "@/lib/playerCharacters";
import { evolvePokemonSprite } from "@/lib/pokemonSprites";
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
type GameScreen =
  | "title"
  | "battle-player-card"
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

type SkipContinuation = {
  stage: "gym";
  fromIndex: number;
  toIndex: number;
};

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<GameScreen>("title");
  const [revealedCards, setRevealedCards] = useState<(Pokemon | null)[]>(
    createEmptyCards,
  );
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [activeTeam, setActiveTeam] = useState<Pokemon[]>([]);
  const [pokemonCatalog, setPokemonCatalog] = useState<Pokemon[]>([]);
  const [completedBattleWins, setCompletedBattleWins] = useState(0);
  const [pendingEvolution, setPendingEvolution] = useState<PendingEvolution | null>(null);
  const [skipContinuation, setSkipContinuation] = useState<SkipContinuation | null>(null);
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

    if (slotIndex < 0 || slotIndex >= TEAM_SIZE) {
      setError("Choose a valid team card.");
      return;
    }

    setRevealedCards((currentCards) => {
      const duplicateInAnotherSlot = currentCards.some(
        (selected, index) =>
          index !== slotIndex && selected?.id === pokemon.id,
      );

      if (duplicateInAnotherSlot) {
        setError(`${pokemon.name} is already on your team.`);
        return currentCards;
      }

      const nextCards = [...currentCards];
      nextCards[slotIndex] = pokemon;

      const nextTeam = nextCards.filter(
        (card): card is Pokemon => Boolean(card),
      );

      teamRef.current = nextTeam;
      setTeam(nextTeam);

      return nextCards;
    });
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
      setSkipContinuation(null);
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
    setSkipContinuation(null);
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
    setScreen("title");
  }

  function resetCurrentRun() {
    clearRunState();
    setTrainerProfile(createBattleTrainerProfile());
    setScreen("select-team");
  }

  function tryAgain() {
    clearRunState();
    setTrainerProfile(createBattleTrainerProfile());
    setScreen("select-team");
  }

  function startArcadeMode() {
    clearRunState();
    setTrainerProfile(null);
    setScreen("battle-player-card");
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

  function getEligibleEvolutions(currentTeam: Pokemon[]) {
    return currentTeam.flatMap((fromPokemon, teamIndex) => {
      const nextEvolutionName = getNextEvolutionName(fromPokemon.name);

      if (!nextEvolutionName) {
        return [];
      }

      const toPokemon = pokemonCatalog.find(
        (pokemon) => pokemon.name.toLowerCase() === nextEvolutionName.toLowerCase(),
      );

      if (!toPokemon) {
        return [];
      }

      return [
        {
          fromPokemon,
          toPokemon: evolvePokemonSprite(fromPokemon, toPokemon),
          teamIndex,
        },
      ];
    });
  }

  function queueEvolutionIfNeeded(
    nextCompletedBattleWins: number,
    currentTeam: Pokemon[] = getRunTeam(),
  ) {
    if (!EVOLUTION_TRIGGER_WINS.has(nextCompletedBattleWins)) {
      return false;
    }

    const eligibleEvolutions = getEligibleEvolutions(currentTeam);

    if (eligibleEvolutions.length === 0) {
      return false;
    }

    const randomEvolution =
      eligibleEvolutions[Math.floor(Math.random() * eligibleEvolutions.length)];

    setPendingEvolution(randomEvolution);
    return true;
  }

  function countSkippedWins(
    opponents: OpponentMeta[],
    breakdowns: OpponentBreakdown[] | undefined,
    fromIndex: number,
    toIndex: number,
  ) {
    let wins = 0;

    for (let index = fromIndex; index < toIndex; index += 1) {
      const breakdown = findBreakdown(breakdowns, opponents[index].name);

      if (didBeatOpponent(breakdown)) {
        wins += 1;
      }
    }

    return wins;
  }

  function finishSkippedGymBattles(
    fromIndex: number,
    toIndex: number,
    currentTeam: Pokemon[] = getRunTeam(),
  ) {
    if (!result || toIndex <= fromIndex) {
      return;
    }

    const skippedWins = countSkippedWins(
      GYM_LEADERS,
      result.opponent_breakdown?.gym_leaders,
      fromIndex,
      toIndex,
    );
    const nextCompletedBattleWins = completedBattleWins + skippedWins;

    setGymRevealedCount(toIndex);
    setCompletedBattleWins(nextCompletedBattleWins);
    queueEvolutionIfNeeded(nextCompletedBattleWins, currentTeam);
  }

  function skipGymBattles() {
    if (!result) {
      return;
    }

    const finalRevealCount = getRevealCountUntilLoss(
      GYM_LEADERS,
      result.opponent_breakdown?.gym_leaders,
    );

    if (finalRevealCount <= gymRevealedCount) {
      return;
    }

    const currentTeam = getRunTeam();
    const hasAvailableEvolution = getEligibleEvolutions(currentTeam).length > 0;

    if (!hasAvailableEvolution) {
      finishSkippedGymBattles(gymRevealedCount, finalRevealCount, currentTeam);
      return;
    }

    const firstRevealCount =
      gymRevealedCount < 4 ? Math.min(4, finalRevealCount) : finalRevealCount;
    const skippedWins = countSkippedWins(
      GYM_LEADERS,
      result.opponent_breakdown?.gym_leaders,
      gymRevealedCount,
      firstRevealCount,
    );
    const nextCompletedBattleWins = completedBattleWins + skippedWins;

    setGymRevealedCount(firstRevealCount);
    setCompletedBattleWins(nextCompletedBattleWins);

    const evolutionQueued = queueEvolutionIfNeeded(
      nextCompletedBattleWins,
      currentTeam,
    );

    if (evolutionQueued && firstRevealCount < finalRevealCount) {
      setSkipContinuation({
        stage: "gym",
        fromIndex: firstRevealCount,
        toIndex: finalRevealCount,
      });
      return;
    }

    if (firstRevealCount < finalRevealCount) {
      const remainingWins = countSkippedWins(
        GYM_LEADERS,
        result.opponent_breakdown?.gym_leaders,
        firstRevealCount,
        finalRevealCount,
      );
      const finalCompletedBattleWins = nextCompletedBattleWins + remainingWins;

      setGymRevealedCount(finalRevealCount);
      setCompletedBattleWins(finalCompletedBattleWins);
      queueEvolutionIfNeeded(finalCompletedBattleWins, currentTeam);
    }
  }

  function skipEliteFourBattles() {
    if (!result) {
      return;
    }

    const finalRevealCount = getRevealCountUntilLoss(
      ELITE_FOUR,
      result.opponent_breakdown?.elite_four,
    );

    if (finalRevealCount <= eliteRevealedCount) {
      return;
    }

    const skippedWins = countSkippedWins(
      ELITE_FOUR,
      result.opponent_breakdown?.elite_four,
      eliteRevealedCount,
      finalRevealCount,
    );
    const nextCompletedBattleWins = completedBattleWins + skippedWins;

    setEliteRevealedCount(finalRevealCount);
    setCompletedBattleWins(nextCompletedBattleWins);

    if (getEligibleEvolutions(getRunTeam()).length > 0) {
      queueEvolutionIfNeeded(nextCompletedBattleWins);
    }
  }

  function completeEvolution() {
    if (!pendingEvolution) {
      return;
    }

    const nextTeam = [...getRunTeam()];
    nextTeam[pendingEvolution.teamIndex] = pendingEvolution.toPokemon;

    setActiveTeam(nextTeam);
    setPendingEvolution(null);

    if (skipContinuation?.stage === "gym") {
      const { fromIndex, toIndex } = skipContinuation;
      setSkipContinuation(null);
      finishSkippedGymBattles(fromIndex, toIndex, nextTeam);
    }
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
        onSelectArcadeMode={startArcadeMode}
        onSelectMarathonMode={() => router.push("/marathon")}
      />
    );
  }

  if (screen === "battle-player-card") {
    return (
      <BattlePlayerCardScreen
        onMainMenu={returnToMainMenu}
        onPlayerReady={(savedTrainerProfile) => {
          setTrainerProfile(savedTrainerProfile);
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
        modeLabel="Arcade Mode"
        onBattleLeader={startGymBattle}
        onChallengeEliteFour={() => setScreen("elite-four")}
        onMainMenu={returnToMainMenu}
        onResetRun={resetCurrentRun}
        onSkipBattles={skipGymBattles}
        onViewResults={() => setScreen("end-results")}
      />,
    );
  }

  if (screen === "elite-four" && result) {
    return withEvolutionModal(
      <EliteFourScreen
        result={result}
        revealedCount={eliteRevealedCount}
        modeLabel="Arcade Mode"
        onBattleEliteMember={startEliteFourBattle}
        onChallengeChampion={() => setScreen("champion")}
        onMainMenu={returnToMainMenu}
        onSkipBattles={skipEliteFourBattles}
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
        modeLabel="Arcade Mode"
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
        modeLabel="Arcade Mode"
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
        modeLabel="Arcade Mode"
        onMainMenu={returnToMainMenu}
        onTryAgain={tryAgain}
      />
    );
  }

  return (
    <main className="game-shell">
      <BattleSelectionScreen
        key={`arcade-${runKey}`}
        error={error}
        revealedCards={revealedCards}
        isSubmitting={isSubmitting}
        selectedPokemon={getRunTeam()}
        onMainMenu={returnToMainMenu}
        onRevealCard={revealCard}
        onResetRun={resetCurrentRun}
        onSubmitTeam={submitTeam}
      />
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
    sprite: DEFAULT_PLAYER_CHARACTER_ID,
    created_at: "",
  };
}
