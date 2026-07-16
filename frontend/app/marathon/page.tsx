"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArcadeBattleSimulation } from "@/components/ArcadeBattleSimulation";
import { BattleSelectionScreen } from "@/components/BattleSelectionScreen";
import { EvolutionModal } from "@/components/EvolutionModal";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { PlayerCharacterSelector } from "@/components/PlayerCharacterSelector";
import { ProgressionCard } from "@/components/ProgressionCard";
import {
  EVOLUTION_WIN_INTERVAL,
  REGULAR_WINS_PER_GYM,
  chooseOpponentTeam,
  createArcadeBreakdown,
  createMajorTrainer,
  getPredeterminedMajorResults,
  getRegularTeamSize,
  getStrictEndpointId,
  shuffleTrainerCycle,
  type ArcadeEncounter,
  type ArcadeTrainer,
} from "@/lib/arcade";
import { getPokemon, scoreTeam } from "@/lib/api";
import { getNextEvolutionName } from "@/lib/evolutions";
import {
  BADGE_IMAGE_PATHS,
  getPlayerTrainerSprite,
  getTrainerSprite,
} from "@/lib/imagePaths";
import {
  getPlayerCharacter,
  toPlayerCharacterMeta,
  type PlayerCharacterId,
} from "@/lib/playerCharacters";
import { CHAMPION, ELITE_FOUR, GYM_LEADERS } from "@/lib/progression";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

type Phase =
  | "character"
  | "pokemon"
  | "matchup"
  | "animating"
  | "result"
  | "results"
  | "complete";
type PendingEvolution = {
  fromPokemon: Pokemon;
  toPokemon: Pokemon;
  teamIndex: number;
};

const TEAM_SIZE = 6;

const MARATHON_STAGES = [
  { number: 1, city: "Pewter City", gymLeader: "Brock", badge: "Boulder Badge" },
  { number: 2, city: "Cerulean City", gymLeader: "Misty", badge: "Cascade Badge" },
  { number: 3, city: "Vermilion City", gymLeader: "Lt. Surge", badge: "Thunder Badge" },
  { number: 4, city: "Celadon City", gymLeader: "Erika", badge: "Rainbow Badge" },
  { number: 5, city: "Fuchsia City", gymLeader: "Koga", badge: "Soul Badge" },
  { number: 6, city: "Saffron City", gymLeader: "Sabrina", badge: "Marsh Badge" },
  { number: 7, city: "Cinnabar Island", gymLeader: "Blaine", badge: "Volcano Badge" },
  { number: 8, city: "Viridian City", gymLeader: "Giovanni", badge: "Earth Badge" },
] as const;

function createEmptyCards(): (Pokemon | null)[] {
  return Array.from({ length: TEAM_SIZE }, () => null);
}

function opponentRole(type: ArcadeTrainer["type"]) {
  if (type === "gym-leader") return "Gym Leader";
  if (type === "elite-four") return "Elite Four";
  if (type === "champion") return "Champion";
  return "Trainer";
}

function opponentSummary(opponent: ArcadeTrainer) {
  return `${opponent.pokemonCount} POKÉMON • ${opponentRole(opponent.type).toUpperCase()}`;
}

function BadgeStrip({ earnedBadges }: { earnedBadges: string[] }) {
  return (
    <div className="marathon-badge-strip" aria-label={`${earnedBadges.length} of 8 badges earned`}>
      {MARATHON_STAGES.map((stage) => {
        const earned = earnedBadges.includes(stage.badge);
        return (
          <span
            className={`marathon-badge-strip__slot ${earned ? "" : "marathon-badge-strip__slot--locked"}`}
            key={stage.badge}
            title={stage.badge}
          >
            <LocalSprite
              alt={`${stage.badge} sprite`}
              className="marathon-badge-strip__sprite"
              fallback={String(stage.number)}
              src={BADGE_IMAGE_PATHS[stage.badge]}
            />
          </span>
        );
      })}
    </div>
  );
}

export default function MarathonPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("character");
  const [characterId, setCharacterId] = useState<PlayerCharacterId>("chaz");
  const [catalogue, setCatalogue] = useState<Pokemon[]>([]);
  const [revealedCards, setRevealedCards] = useState<(Pokemon | null)[]>(createEmptyCards);
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [scoreResult, setScoreResult] = useState<TeamScoreResult | null>(null);
  const [endpointId, setEndpointId] = useState("");
  const [regularQueue, setRegularQueue] = useState<ArcadeTrainer[]>([]);
  const [previousRegularId, setPreviousRegularId] = useState<string | null>(null);
  const [regularWins, setRegularWins] = useState(0);
  const [gymIndex, setGymIndex] = useState(0);
  const [eliteIndex, setEliteIndex] = useState(0);
  const [currentOpponent, setCurrentOpponent] = useState<ArcadeTrainer | null>(null);
  const [currentOpponentTeam, setCurrentOpponentTeam] = useState<Pokemon[]>([]);
  const [currentOutcome, setCurrentOutcome] = useState<"Beat" | "Lost" | null>(null);
  const [encounters, setEncounters] = useState<ArcadeEncounter[]>([]);
  const [totalWins, setTotalWins] = useState(0);
  const [totalBattles, setTotalBattles] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [pendingEvolution, setPendingEvolution] = useState<PendingEvolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const character = getPlayerCharacter(characterId);
  const isPokemonLeague = gymIndex >= MARATHON_STAGES.length;
  const currentStage = isPokemonLeague
    ? null
    : MARATHON_STAGES[Math.min(gymIndex, MARATHON_STAGES.length - 1)];
  const isGymLeaderBattle = currentOpponent?.type === "gym-leader";
  const isEliteFourBattle = currentOpponent?.type === "elite-four";
  const isChampionBattle = currentOpponent?.type === "champion";
  const trainerProgress = Math.min(
    REGULAR_WINS_PER_GYM,
    regularWins +
      (phase === "result" &&
      currentOutcome === "Beat" &&
      currentOpponent?.type === "regular"
        ? 1
        : 0),
  );
  const playerPower = Math.round(
    scoreResult?.total_score ??
      scoreResult?.team_score ??
      scoreResult?.score ??
      averagePower(team),
  );
  const trainerProfile: TrainerProfile = {
    name: character.label,
    dob: "",
    email: "",
    hometown: "Pallet Town",
    sprite: character.id,
    created_at: "",
  };

  useEffect(() => {
    getPokemon()
      .then(setCatalogue)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load Pokemon."),
      );
  }, []);

  function revealCard(slotIndex: number, pokemon: Pokemon) {
    setError("");
    setRevealedCards((current) => {
      const duplicate = current.some(
        (selected, index) => index !== slotIndex && selected?.id === pokemon.id,
      );
      if (duplicate) {
        setError(`${pokemon.name} is already on your team.`);
        return current;
      }
      const next = [...current];
      next[slotIndex] = pokemon;
      setTeam(next.filter((entry): entry is Pokemon => Boolean(entry)));
      return next;
    });
  }

  function resetPokemonSelection() {
    setRevealedCards(createEmptyCards());
    setTeam([]);
    setError("");
  }

  async function confirmTeam() {
    if (team.length !== TEAM_SIZE) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await scoreTeam(team.map((pokemon) => pokemon.name));
      const queue = shuffleTrainerCycle();
      setScoreResult(result);
      setEndpointId(getStrictEndpointId(result));
      setRegularQueue(queue);
      setRegularWins(0);
      setGymIndex(0);
      setEliteIndex(0);
      setTotalWins(0);
      setTotalBattles(0);
      setEarnedBadges([]);
      setEncounters([]);
      prepareNextOpponent(result, 0, 0, queue, 0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to score this team.");
    } finally {
      setIsLoading(false);
    }
  }

  function prepareNextOpponent(
    result = scoreResult,
    nextGymIndex = gymIndex,
    nextRegularWins = regularWins,
    suppliedQueue = regularQueue,
    nextEliteIndex = eliteIndex,
  ) {
    if (!result) return;
    let opponent: ArcadeTrainer;
    let opponentTeam: Pokemon[];
    let nextQueue = suppliedQueue;

    if (nextGymIndex < GYM_LEADERS.length) {
      if (nextRegularWins >= REGULAR_WINS_PER_GYM) {
        opponent = createMajorTrainer(GYM_LEADERS[nextGymIndex], "gym-leader");
        opponentTeam = namesToPokemon(opponent.pokemonTeam, catalogue);
      } else {
        if (nextQueue.length === 0) nextQueue = shuffleTrainerCycle(previousRegularId);
        opponent = { ...nextQueue[0] };
        nextQueue = nextQueue.slice(1);
        const size = getRegularTeamSize(nextGymIndex);
        opponentTeam = chooseOpponentTeam(
          catalogue,
          size,
          playerPower || averagePower(team),
          nextGymIndex,
        );
        opponent.pokemonCount = size;
        opponent.pokemonTeam = opponentTeam.map((pokemon) => pokemon.name);
        setPreviousRegularId(opponent.id);
      }
    } else if (nextEliteIndex < ELITE_FOUR.length) {
      opponent = createMajorTrainer(ELITE_FOUR[nextEliteIndex], "elite-four");
      opponentTeam = namesToPokemon(opponent.pokemonTeam, catalogue);
    } else {
      opponent = createMajorTrainer(CHAMPION, "champion");
      opponentTeam = namesToPokemon(opponent.pokemonTeam, catalogue);
    }

    setRegularQueue(nextQueue);
    setCurrentOpponent(opponent);
    setCurrentOpponentTeam(opponentTeam);
    setCurrentOutcome(null);
    setPhase("matchup");
  }

  function battle() {
    if (!currentOpponent || !scoreResult) return;
    const outcome =
      currentOpponent.type === "regular" ||
      endpointId === "complete" ||
      currentOpponent.id !== endpointId
        ? "Beat"
        : "Lost";
    setCurrentOutcome(outcome);
    setPhase("animating");
  }

  function skipTrainerBattle() {
    if (!currentOpponent || currentOpponent.type !== "regular" || phase !== "matchup") {
      return;
    }
    setCurrentOutcome("Beat");
    finishBattle("Beat");
  }

  function finishBattle(outcome: "Beat" | "Lost") {
    if (!currentOpponent) return;
    const nextBattleCount = totalBattles + 1;
    const nextWinCount = totalWins + (outcome === "Beat" ? 1 : 0);
    setTotalBattles(nextBattleCount);
    setTotalWins(nextWinCount);
    setEncounters((current) => [
      ...current,
      {
        id: `${currentOpponent.id}:${nextBattleCount}`,
        opponent: currentOpponent,
        opponentTeam: currentOpponentTeam,
        outcome,
      },
    ]);
    if (outcome === "Beat") {
      if (currentOpponent.type === "gym-leader" && currentOpponent.badge) {
        setEarnedBadges((current) => [...current, currentOpponent.badge!]);
      }
      queueEvolution(nextWinCount);
    }
    setPhase("result");
  }

  function queueEvolution(nextWinCount: number) {
    if (nextWinCount % EVOLUTION_WIN_INTERVAL !== 0) return;
    const eligible = team.flatMap((fromPokemon, teamIndex) => {
      const nextName = getNextEvolutionName(fromPokemon.name);
      const toPokemon = nextName
        ? catalogue.find((pokemon) => pokemon.name.toLowerCase() === nextName.toLowerCase())
        : undefined;
      return toPokemon ? [{ fromPokemon, toPokemon, teamIndex }] : [];
    });
    if (eligible.length > 0) setPendingEvolution(eligible[0]);
  }

  function completeEvolution() {
    if (!pendingEvolution) return;
    setTeam((current) =>
      current.map((pokemon, index) =>
        index === pendingEvolution.teamIndex ? pendingEvolution.toPokemon : pokemon,
      ),
    );
    setRevealedCards((current) =>
      current.map((pokemon, index) =>
        index === pendingEvolution.teamIndex ? pendingEvolution.toPokemon : pokemon,
      ),
    );
    setPendingEvolution(null);
  }

  function nextBattle() {
    if (!currentOpponent || currentOutcome !== "Beat") return;
    let nextGymIndex = gymIndex;
    let nextRegularWins = regularWins;
    let nextEliteIndex = eliteIndex;

    if (currentOpponent.type === "regular") {
      nextRegularWins += 1;
      setRegularWins(nextRegularWins);
    } else if (currentOpponent.type === "gym-leader") {
      nextGymIndex += 1;
      nextRegularWins = 0;
      setGymIndex(nextGymIndex);
      setRegularWins(0);
    } else if (currentOpponent.type === "elite-four") {
      nextEliteIndex += 1;
      setEliteIndex(nextEliteIndex);
    } else {
      setPhase("complete");
      return;
    }

    prepareNextOpponent(
      scoreResult,
      nextGymIndex,
      nextRegularWins,
      regularQueue,
      nextEliteIndex,
    );
  }

  function tryAgain() {
    resetPokemonSelection();
    setScoreResult(null);
    setEndpointId("");
    setRegularQueue([]);
    setPreviousRegularId(null);
    setRegularWins(0);
    setGymIndex(0);
    setEliteIndex(0);
    setCurrentOpponent(null);
    setCurrentOpponentTeam([]);
    setCurrentOutcome(null);
    setEncounters([]);
    setTotalWins(0);
    setTotalBattles(0);
    setEarnedBadges([]);
    setPendingEvolution(null);
    setPhase("pokemon");
  }

  if (phase === "character") {
    return (
      <main className="game-shell stage-shell marathon-shell">
        <section className="stage-screen marathon-stage-screen marathon-character-screen">
          <GameTopBar modeLabel="Marathon Mode" onMainMenu={() => router.push("/")} />
          <div className="stage-hero marathon-character-hero">
            <p className="eyebrow">Marathon Mode</p>
            <h1>Choose Your Character</h1>
          </div>
          <PlayerCharacterSelector
            ariaLabel="Marathon Mode player character"
            className="marathon-character-selector"
            selectedCharacterId={characterId}
            onChange={setCharacterId}
          />
          <button
            className="primary-action stage-action marathon-continue-button"
            type="button"
            onClick={() => setPhase("pokemon")}
          >
            CONTINUE
          </button>
        </section>
      </main>
    );
  }

  if (phase === "pokemon") {
    return (
      <main className="game-shell">
        <BattleSelectionScreen
          revealedCards={revealedCards}
          selectedPokemon={team}
          error={error}
          isSubmitting={isLoading}
          onMainMenu={() => router.push("/")}
          onRevealCard={revealCard}
          onResetRun={resetPokemonSelection}
          onSubmitTeam={confirmTeam}
        />
      </main>
    );
  }

  if (phase === "animating" && currentOpponent && currentOutcome) {
    return (
      <ArcadeBattleSimulation
        trainerProfile={trainerProfile}
        selectedPokemon={team}
        opponent={currentOpponent}
        opponentTeam={currentOpponentTeam}
        outcome={currentOutcome}
        canSkipAnimation={currentOpponent.type === "regular"}
        onComplete={() => finishBattle(currentOutcome)}
        onMainMenu={() => router.push("/")}
      />
    );
  }

  if ((phase === "matchup" || phase === "result") && currentOpponent) {
    const playerStatus =
      phase === "result" ? (currentOutcome === "Beat" ? "cleared" : "failed") : "pending";
    const opponentStatus =
      phase === "result" ? (currentOutcome === "Beat" ? "cleared" : "failed") : "pending";
    const opponentResultStamp =
      phase === "result" && currentOutcome
        ? {
            text: currentOutcome === "Beat" ? "DEFEATED" : "WIPED OUT",
            tone: currentOutcome === "Beat" ? "success" : "danger",
          } as const
        : null;
    const breakdown = currentOutcome
      ? createArcadeBreakdown(currentOpponent, currentOutcome, playerPower)
      : undefined;
    const location = currentStage?.city ?? "Pokémon League";

    return (
      <main className="game-shell stage-shell marathon-shell">
        <section className="stage-screen marathon-stage-screen marathon-battle-screen">
          <GameTopBar modeLabel="Marathon Mode" onMainMenu={() => router.push("/")} />

          <header className="marathon-battle-header">
            <p className="eyebrow">{isPokemonLeague ? "Pokémon League" : `Stage ${currentStage?.number}`}</p>
            <h1>{isPokemonLeague ? "Pokémon League" : currentStage?.city}</h1>
          </header>

          <BadgeStrip earnedBadges={earnedBadges} />

          {phase === "matchup" ? (
            <div className="marathon-battle-actions">
              <button className="primary-action stage-action" type="button" onClick={battle}>
                {isGymLeaderBattle
                  ? `BATTLE ${currentOpponent.name.toUpperCase()}`
                  : isChampionBattle
                    ? "CHAMPION BATTLE"
                    : isEliteFourBattle
                      ? "ELITE FOUR BATTLE"
                      : "BATTLE"}
              </button>
              {currentOpponent.type === "regular" ? (
                <button
                  className="secondary-action marathon-skip-trainer"
                  type="button"
                  onClick={skipTrainerBattle}
                >
                  SKIP TRAINER
                </button>
              ) : null}
            </div>
          ) : currentOutcome === "Beat" ? (
            <button className="primary-action stage-action" type="button" onClick={nextBattle}>
              {currentOpponent.type === "gym-leader"
                ? gymIndex === MARATHON_STAGES.length - 1
                  ? "ENTER POKÉMON LEAGUE"
                  : "NEXT STAGE"
                : currentOpponent.type === "champion"
                  ? "COMPLETE MARATHON"
                  : "NEXT BATTLE"}
            </button>
          ) : (
            <button
              className="primary-action stage-action"
              type="button"
              onClick={() => setPhase("results")}
            >
              RESULTS
            </button>
          )}

          <div className="marathon-matchup-grid">
            <ProgressionCard
              className="player-character-card marathon-player-battle-card"
              detailItems={team.map((pokemon) => pokemon.name)}
              explicitResultStamp={null}
              meta={{
                ...toPlayerCharacterMeta(character, 0),
                pokemonCount: 6,
                pokemonTeam: team.map((pokemon) => pokemon.name),
              }}
              roleLabel={null}
              spritePresentation="full-body"
              spriteSrc={getPlayerTrainerSprite(character.id)}
              status={playerStatus}
              suppressAutomaticStamp
            />
            <strong className="marathon-versus">VS</strong>
            <ProgressionCard
              breakdown={breakdown}
              className={`marathon-opponent-battle-card marathon-opponent-battle-card--${currentOpponent.type}`}
              detailItems={
                currentOpponent.type === "gym-leader"
                  ? currentOpponent.pokemonTeam
                  : currentOpponentTeam.map((pokemon) => pokemon.name)
              }
              explicitResultStamp={opponentResultStamp}
              locationLabel={
                currentOpponent.type === "gym-leader"
                  ? currentOpponent.badge
                  : undefined
              }
              meta={currentOpponent}
              roleLabel={
                currentOpponent.type === "regular"
                  ? null
                  : opponentRole(currentOpponent.type)
              }
              spritePresentation="pixel-trainer"
              spriteSrc={currentOpponent.sprite || getTrainerSprite(currentOpponent.name)}
              status={opponentStatus}
              summaryLabel={
                currentOpponent.type === "gym-leader"
                  ? undefined
                  : currentOpponent.type === "regular"
                    ? undefined
                    : opponentSummary(currentOpponent)
              }
              suppressAutomaticStamp={Boolean(opponentResultStamp)}
            />
          </div>

          {!isPokemonLeague ? (
            <section className="marathon-progress-panel" aria-label="Stage progress">
              <div className="marathon-progress-panel__dots">
                {Array.from({ length: REGULAR_WINS_PER_GYM }, (_, index) => (
                  <span
                    className={`marathon-progress-panel__dot ${
                      index < trainerProgress ? "marathon-progress-panel__dot--complete" : ""
                    }`}
                    key={index}
                  />
                ))}
                <span
                  className={`marathon-progress-panel__gym ${
                    isGymLeaderBattle ? "marathon-progress-panel__gym--active" : ""
                  }`}
                >
                  GYM
                </span>
              </div>
            </section>
          ) : null}
        </section>
        {pendingEvolution ? (
          <EvolutionModal
            fromPokemon={pendingEvolution.fromPokemon}
            toPokemon={pendingEvolution.toPokemon}
            onComplete={completeEvolution}
          />
        ) : null}
      </main>
    );
  }

  return (
    <MarathonResults
      characterId={characterId}
      team={team}
      scoreResult={scoreResult}
      encounters={encounters}
      earnedBadges={earnedBadges}
      totalWins={totalWins}
      totalBattles={totalBattles}
      completed={phase === "complete"}
      onTryAgain={tryAgain}
      onMainMenu={() => router.push("/")}
    />
  );
}

function MarathonResults({
  characterId,
  team,
  scoreResult,
  encounters,
  earnedBadges,
  totalWins,
  totalBattles,
  completed,
  onTryAgain,
  onMainMenu,
}: {
  characterId: PlayerCharacterId;
  team: Pokemon[];
  scoreResult: TeamScoreResult | null;
  encounters: ArcadeEncounter[];
  earnedBadges: string[];
  totalWins: number;
  totalBattles: number;
  completed: boolean;
  onTryAgain: () => void;
  onMainMenu: () => void;
}) {
  const character = getPlayerCharacter(characterId);
  const power = Math.round(
    scoreResult?.total_score ??
      scoreResult?.team_score ??
      scoreResult?.score ??
      averagePower(team),
  );
  const majorResults = scoreResult ? getPredeterminedMajorResults(scoreResult) : [];
  const regularEncounters = encounters.filter((entry) => entry.opponent.type === "regular");
  const lastEncounter = encounters.at(-1);

  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen end-results-screen">
        <GameTopBar modeLabel="Marathon Mode" onMainMenu={onMainMenu} />
        <div className="stage-hero">
          <p className="eyebrow">Marathon Results</p>
          <h1>{completed ? "MARATHON CHAMPION" : "MARATHON RUN COMPLETE"}</h1>
          <p>{totalWins} wins from {totalBattles} battles</p>
        </div>

        <article className="results-trainer-card">
          <div className="results-trainer-card__top">
            <span className="results-trainer-card__logo">POKEMON 6</span>
            <strong className="results-trainer-card__player-name">{character.label}</strong>
          </div>
          <div className="results-trainer-card__artwork">
            <LocalSprite
              alt={character.label}
              className="results-trainer-card__sprite"
              fallback={character.fallback}
              src={getPlayerTrainerSprite(character.id)}
            />
          </div>
          <div className="results-trainer-card__stats">
            <div><span>Player Power</span><strong>{power}</strong></div>
            <div><span>Record</span><strong>{totalWins}/{totalBattles}</strong></div>
          </div>
        </article>

        <section className="marathon-results-badges">
          <h2>Badge Progress</h2>
          <BadgeStrip earnedBadges={earnedBadges} />
        </section>

        <section className="results-team-section">
          <h2>Final Pokemon Team</h2>
          <div className="results-team-grid">
            {team.map((pokemon) => (
              <article className="results-pokemon-summary-card" key={pokemon.id}>
                <div className="results-pokemon-summary-card__sprite-wrap">
                  <img alt={pokemon.name} className="results-pokemon-summary-card__sprite" src={pokemon.image} />
                </div>
                <strong>{pokemon.name}</strong>
                <span>BST {pokemon.base_stat_total}</span>
              </article>
            ))}
          </div>
        </section>

        {MARATHON_STAGES.map((stage, stageIndex) => {
          const stageRegulars = regularEncounters.slice(
            stageIndex * REGULAR_WINS_PER_GYM,
            stageIndex * REGULAR_WINS_PER_GYM + REGULAR_WINS_PER_GYM,
          );
          const gymResult = majorResults.find(
            ({ opponent }) =>
              opponent.type === "gym-leader" && opponent.name === stage.gymLeader,
          );
          const gymEncounter = gymResult
            ? encounters.find((entry) => entry.opponent.id === gymResult.opponent.id)
            : undefined;

          return (
            <section className="marathon-results-stage" key={stage.number}>
              <div className="marathon-results-stage__heading">
                <h2>Stage {stage.number}</h2>
                <span>{stage.city}</span>
              </div>
              <div className="marathon-results-stage__grid">
                {Array.from({ length: REGULAR_WINS_PER_GYM }, (_, slotIndex) => {
                  const encounter = stageRegulars[slotIndex];
                  if (!encounter) {
                    return (
                      <article className="marathon-results-placeholder" key={`stage-${stage.number}-trainer-${slotIndex}`}>
                        <div><span>Trainer {slotIndex + 1}</span><strong>Not Reached</strong></div>
                      </article>
                    );
                  }
                  const isCurrent = lastEncounter?.id === encounter.id && encounter.outcome === "Lost";
                  return (
                    <ProgressionCard
                      key={encounter.id}
                      breakdown={createArcadeBreakdown(encounter.opponent, encounter.outcome, power)}
                      className={`marathon-results-opponent-card ${isCurrent ? "marathon-results-opponent-card--current" : ""}`}
                      locationLabel={stage.city}
                      meta={encounter.opponent}
                      roleLabel="Trainer"
                      spritePresentation="pixel-trainer"
                      spriteSrc={encounter.opponent.sprite || getTrainerSprite(encounter.opponent.name)}
                      status={encounter.outcome === "Beat" ? "cleared" : "failed"}
                      summaryLabel={opponentSummary(encounter.opponent)}
                    />
                  );
                })}

                {gymResult ? (
                  <ProgressionCard
                    breakdown={
                      gymEncounter
                        ? createArcadeBreakdown(gymResult.opponent, gymEncounter.outcome, power)
                        : undefined
                    }
                    className={`marathon-results-opponent-card ${
                      lastEncounter?.id === gymEncounter?.id && gymEncounter?.outcome === "Lost"
                        ? "marathon-results-opponent-card--current"
                        : !gymEncounter
                          ? "marathon-results-opponent-card--locked"
                          : ""
                    }`}
                    isLocked={!gymEncounter}
                    detailItems={gymResult.opponent.pokemonTeam}
                    locationLabel={gymResult.opponent.badge}
                    meta={gymResult.opponent}
                    roleLabel="Gym Leader"
                    spritePresentation="pixel-trainer"
                    status={
                      gymEncounter
                        ? gymEncounter.outcome === "Beat"
                          ? "cleared"
                          : "failed"
                        : "not-reached"
                    }
                  />
                ) : null}
              </div>
            </section>
          );
        })}

        <section className="marathon-results-stage marathon-results-stage--league">
          <div className="marathon-results-stage__heading">
            <h2>Pokémon League</h2>
            <span>Elite Four & Champion</span>
          </div>
          <div className="marathon-results-stage__grid">
            {majorResults
              .filter(({ opponent }) => opponent.type === "elite-four" || opponent.type === "champion")
              .map(({ opponent }) => {
                const encounter = encounters.find((entry) => entry.opponent.id === opponent.id);
                const isCurrent = lastEncounter?.id === encounter?.id && encounter?.outcome === "Lost";
                return (
                  <ProgressionCard
                    key={opponent.id}
                    breakdown={
                      encounter
                        ? createArcadeBreakdown(opponent, encounter.outcome, power)
                        : undefined
                    }
                    className={`marathon-results-opponent-card ${
                      isCurrent
                        ? "marathon-results-opponent-card--current"
                        : !encounter
                          ? "marathon-results-opponent-card--locked"
                          : ""
                    }`}
                    isLocked={!encounter}
                    locationLabel="Pokémon League"
                    meta={opponent}
                    roleLabel={opponentRole(opponent.type)}
                    spritePresentation="pixel-trainer"
                    status={
                      encounter
                        ? encounter.outcome === "Beat"
                          ? "cleared"
                          : "failed"
                        : "not-reached"
                    }
                    summaryLabel={opponentSummary(opponent)}
                  />
                );
              })}
          </div>
        </section>

        <div className="trainer-card-actions">
          <button className="primary-action" type="button" onClick={onTryAgain}>TRY AGAIN</button>
          <button className="secondary-action" type="button" onClick={onMainMenu}>MAIN MENU</button>
        </div>
      </section>
    </main>
  );
}

function namesToPokemon(names: string[], catalogue: Pokemon[]) {
  return names
    .map((name) =>
      catalogue.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase()),
    )
    .filter((pokemon): pokemon is Pokemon => Boolean(pokemon));
}

function averagePower(team: Pokemon[]) {
  return team.length === 0
    ? 0
    : team.reduce((total, pokemon) => total + pokemon.base_stat_total, 0) / team.length;
}
