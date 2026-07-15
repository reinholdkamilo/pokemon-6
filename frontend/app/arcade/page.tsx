"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EvolutionModal } from "@/components/EvolutionModal";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
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
import { EVOLUTION_TRIGGER_WINS, getNextEvolutionName } from "@/lib/evolutions";
import { BADGE_IMAGE_PATHS, getPlayerTrainerSprite, getTrainerSprite } from "@/lib/imagePaths";
import { PLAYER_CHARACTERS, getPlayerCharacter, toPlayerCharacterMeta, type PlayerCharacterId } from "@/lib/playerCharacters";
import { CHAMPION, ELITE_FOUR, GYM_LEADERS } from "@/lib/progression";
import type { Pokemon, TeamScoreResult, TrainerProfile } from "@/types/pokemon";

type Phase = "character" | "pokemon" | "matchup" | "animating" | "result" | "results" | "complete";

type PendingEvolution = { fromPokemon: Pokemon; toPokemon: Pokemon; teamIndex: number };

const TEAM_SIZE = 6;

export default function ArcadePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("character");
  const [characterId, setCharacterId] = useState<PlayerCharacterId>("chaz");
  const [catalogue, setCatalogue] = useState<Pokemon[]>([]);
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [scoreResult, setScoreResult] = useState<TeamScoreResult | null>(null);
  const [endpointId, setEndpointId] = useState<string>("");
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
  const playerPower = Math.round(scoreResult?.total_score ?? scoreResult?.team_score ?? scoreResult?.score ?? averagePower(team));
  const trainerProfile: TrainerProfile = {
    name: character.label,
    dob: "",
    email: "",
    hometown: "Pallet Town",
    sprite: character.id,
    created_at: "",
  };

  useEffect(() => {
    getPokemon().then(setCatalogue).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load Pokemon."));
  }, []);

  function chooseCharacter(id: PlayerCharacterId) {
    setCharacterId(id);
  }

  function continueFromCharacter() {
    setPhase("pokemon");
  }

  function spinPokemon() {
    if (team.length >= TEAM_SIZE || catalogue.length === 0) return;
    const available = catalogue.filter((pokemon) => !team.some((selected) => selected.id === pokemon.id));
    const selected = available[Math.floor(Math.random() * available.length)];
    if (selected) setTeam((current) => [...current, selected]);
  }

  function resetPokemon() {
    setTeam([]);
    setError("");
  }

  async function confirmTeam() {
    if (team.length !== TEAM_SIZE) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await scoreTeam(team.map((pokemon) => pokemon.name));
      setScoreResult(result);
      setEndpointId(getStrictEndpointId(result));
      setRegularQueue(shuffleTrainerCycle());
      setRegularWins(0);
      setGymIndex(0);
      setEliteIndex(0);
      setTotalWins(0);
      setTotalBattles(0);
      setEarnedBadges([]);
      setEncounters([]);
      prepareNextOpponent(result, 0, 0, shuffleTrainerCycle());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to score this team.");
    } finally {
      setIsLoading(false);
    }
  }

  function prepareNextOpponent(
    result: TeamScoreResult | null = scoreResult,
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
        opponent.pokemonCount = size;
        opponent.pokemonTeam = Array.from({ length: size }, () => "Hidden Pokemon");
        opponentTeam = chooseOpponentTeam(catalogue, size, playerPower || averagePower(team), nextGymIndex);
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
    const outcome = currentOpponent.type === "regular" || endpointId === "complete" || currentOpponent.id !== endpointId ? "Beat" : "Lost";
    setCurrentOutcome(outcome);
    setPhase("animating");
    window.setTimeout(() => finishBattle(outcome), 2600);
  }

  function finishBattle(outcome: "Beat" | "Lost") {
    if (!currentOpponent) return;
    const nextBattleCount = totalBattles + 1;
    const nextWinCount = totalWins + (outcome === "Beat" ? 1 : 0);
    const encounter: ArcadeEncounter = {
      id: `${currentOpponent.id}:${nextBattleCount}`,
      opponent: currentOpponent,
      opponentTeam: currentOpponentTeam,
      outcome,
    };
    setTotalBattles(nextBattleCount);
    setTotalWins(nextWinCount);
    setEncounters((current) => [...current, encounter]);

    if (outcome === "Beat") {
      if (currentOpponent.type === "gym-leader" && currentOpponent.badge) {
        setEarnedBadges((current) => [...current, currentOpponent.badge!]);
      }
      queueEvolution(nextWinCount);
    }
    setPhase("result");
  }

  function queueEvolution(nextWinCount: number) {
    if (nextWinCount % EVOLUTION_WIN_INTERVAL !== 0 && !EVOLUTION_TRIGGER_WINS.has(nextWinCount)) return;
    const eligible = team.flatMap((fromPokemon, teamIndex) => {
      const nextName = getNextEvolutionName(fromPokemon.name);
      const toPokemon = nextName ? catalogue.find((pokemon) => pokemon.name.toLowerCase() === nextName.toLowerCase()) : undefined;
      return toPokemon ? [{ fromPokemon, toPokemon, teamIndex }] : [];
    });
    if (eligible.length > 0) setPendingEvolution(eligible[0]);
  }

  function completeEvolution() {
    if (!pendingEvolution) return;
    setTeam((current) => current.map((pokemon, index) => index === pendingEvolution.teamIndex ? pendingEvolution.toPokemon : pokemon));
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

    prepareNextOpponent(scoreResult, nextGymIndex, nextRegularWins, regularQueue, nextEliteIndex);
  }

  function tryAgain() {
    setTeam([]);
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
      <main className="game-shell stage-shell">
        <section className="stage-screen" aria-label="Arcade character selection">
          <GameTopBar modeLabel="Arcade Mode" onMainMenu={() => router.push("/")} />
          <div className="stage-hero"><p className="eyebrow">Arcade Mode</p><h1>Choose Your Character</h1><p>Select one player for the entire Arcade attempt.</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 16, width: "100%", overflowX: "auto", padding: 8 }}>
            {PLAYER_CHARACTERS.map((option, index) => (
              <ProgressionCard
                key={option.id}
                className="player-character-card"
                detailItems={["Arcade Player"]}
                interactionRole="radio"
                isSelectable
                isSelected={characterId === option.id}
                meta={toPlayerCharacterMeta(option, index)}
                onSelect={() => chooseCharacter(option.id)}
                selectActionLabel="Select"
                spriteSrc={getPlayerTrainerSprite(option.id)}
                status="pending"
              />
            ))}
          </div>
          <button className="primary-action stage-action" type="button" onClick={continueFromCharacter}>CONTINUE</button>
        </section>
      </main>
    );
  }

  if (phase === "pokemon") {
    return (
      <main className="game-shell stage-shell">
        <section className="stage-screen" aria-label="Arcade Pokemon selection">
          <GameTopBar modeLabel="Arcade Mode" onMainMenu={() => router.push("/")} />
          <div className="stage-hero"><p className="eyebrow">Pokemon Select</p><h1>Build Your Team of Six</h1><p>Spin until all six cards are filled, then choose your team.</p></div>
          <div className="results-team-grid">
            {Array.from({ length: TEAM_SIZE }, (_, index) => {
              const pokemon = team[index];
              return <article className="results-pokemon-summary-card" key={index}>{pokemon ? <><div className="results-pokemon-summary-card__sprite-wrap"><img alt={pokemon.name} className="results-pokemon-summary-card__sprite" src={pokemon.image} /></div><strong>{pokemon.name}</strong><span>BST {pokemon.base_stat_total}</span></> : <strong>?</strong>}</article>;
            })}
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <div className="trainer-card-actions">
            <button className="secondary-action" type="button" disabled={team.length >= TEAM_SIZE} onClick={spinPokemon}>SPIN POKEMON</button>
            <button className="secondary-action" type="button" disabled={team.length === 0} onClick={resetPokemon}>RESET TEAM</button>
            <button className="primary-action" type="button" disabled={team.length !== TEAM_SIZE || isLoading} onClick={confirmTeam}>{isLoading ? "SCORING..." : "I CHOOSE YOU!"}</button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "animating" && currentOpponent) {
    return (
      <main className="game-shell stage-shell">
        <section className="stage-screen" aria-label="Arcade battle animation">
          <GameTopBar modeLabel="Arcade Mode" onMainMenu={() => router.push("/")} />
          <div className="stage-hero"><p className="eyebrow">Battle in progress</p><h1>{character.label} VS {currentOpponent.name}</h1><p>The battle animation must finish before the result is revealed.</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 20, width: "100%" }}>
            <LocalSprite alt={character.label} className="battle-intro-trainer" fallback={character.fallback} src={getPlayerTrainerSprite(character.id)} />
            <strong style={{ fontSize: "2rem" }}>VS</strong>
            <LocalSprite alt={currentOpponent.name} className="battle-intro-trainer" fallback={currentOpponent.fallback} src={currentOpponent.sprite || getTrainerSprite(currentOpponent.name)} />
          </div>
          <div className="location-spinner spinning" aria-live="polite">BATTLE!</div>
        </section>
      </main>
    );
  }

  if ((phase === "matchup" || phase === "result") && currentOpponent) {
    const playerStatus = phase === "result" ? (currentOutcome === "Beat" ? "cleared" : "failed") : "pending";
    const opponentStatus = phase === "result" ? (currentOutcome === "Beat" ? "failed" : "cleared") : "pending";
    const breakdown = currentOutcome ? createArcadeBreakdown(currentOpponent, currentOutcome, playerPower) : undefined;
    const playerBreakdown = currentOutcome ? createArcadeBreakdown({ ...currentOpponent, name: character.label }, currentOutcome === "Beat" ? "Beat" : "Lost", playerPower) : undefined;
    return (
      <main className="game-shell stage-shell">
        <section className="stage-screen" aria-label="Arcade matchup">
          <GameTopBar modeLabel="Arcade Mode" onMainMenu={() => router.push("/")} />
          <div className="stage-hero"><p className="eyebrow">Arcade Battle {totalBattles + (phase === "matchup" ? 1 : 0)}</p><h1>Player Card VS Opponent Card</h1><p>{regularWins} / {REGULAR_WINS_PER_GYM} regular wins before the next Gym Leader</p></div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) auto minmax(240px, 1fr)", gap: 20, alignItems: "center", width: "100%" }}>
            <ProgressionCard className="player-character-card" detailItems={team.map((pokemon) => pokemon.name)} breakdown={playerBreakdown} meta={{ ...toPlayerCharacterMeta(character, 0), pokemonCount: 6, pokemonTeam: team.map((pokemon) => pokemon.name) }} spriteSrc={getPlayerTrainerSprite(character.id)} status={playerStatus} />
            <strong style={{ fontSize: "2rem" }}>VS</strong>
            <ProgressionCard breakdown={breakdown} detailItems={phase === "matchup" ? [`${currentOpponent.pokemonCount} hidden Pokemon`] : currentOpponentTeam.map((pokemon) => pokemon.name)} meta={currentOpponent} spriteSrc={currentOpponent.sprite || getTrainerSprite(currentOpponent.name)} status={opponentStatus} showBadge={currentOpponent.type === "gym-leader"} />
          </div>
          {phase === "matchup" ? <button className="primary-action stage-action" type="button" onClick={battle}>BATTLE</button> : currentOutcome === "Beat" ? <button className="primary-action stage-action" type="button" onClick={nextBattle}>NEXT BATTLE</button> : <button className="primary-action stage-action" type="button" onClick={() => setPhase("results")}>RESULTS</button>}
        </section>
        {pendingEvolution ? <EvolutionModal fromPokemon={pendingEvolution.fromPokemon} toPokemon={pendingEvolution.toPokemon} onComplete={completeEvolution} /> : null}
      </main>
    );
  }

  return <ArcadeResults characterId={characterId} team={team} scoreResult={scoreResult} encounters={encounters} earnedBadges={earnedBadges} totalWins={totalWins} totalBattles={totalBattles} completed={phase === "complete"} onTryAgain={tryAgain} onMainMenu={() => router.push("/")} />;
}

function ArcadeResults({ characterId, team, scoreResult, encounters, earnedBadges, totalWins, totalBattles, completed, onTryAgain, onMainMenu }: { characterId: PlayerCharacterId; team: Pokemon[]; scoreResult: TeamScoreResult | null; encounters: ArcadeEncounter[]; earnedBadges: string[]; totalWins: number; totalBattles: number; completed: boolean; onTryAgain: () => void; onMainMenu: () => void }) {
  const character = getPlayerCharacter(characterId);
  const power = Math.round(scoreResult?.total_score ?? scoreResult?.team_score ?? scoreResult?.score ?? averagePower(team));
  const majorResults = scoreResult ? getPredeterminedMajorResults(scoreResult) : [];
  return (
    <main className="game-shell stage-shell">
      <section className="stage-screen end-results-screen" aria-label="Arcade results">
        <GameTopBar modeLabel="Arcade Mode" onMainMenu={onMainMenu} />
        <div className="stage-hero"><p className="eyebrow">Arcade Results</p><h1>{completed ? "ARCADE CHAMPION" : "ARCADE RUN COMPLETE"}</h1><p>{totalWins} wins from {totalBattles} battles</p></div>
        <article className="results-trainer-card">
          <div className="results-trainer-card__top"><span className="results-trainer-card__logo">POKEMON 6</span><strong className="results-trainer-card__player-name">{character.label}</strong></div>
          <div className="results-trainer-card__artwork"><LocalSprite alt={character.label} className="results-trainer-card__sprite" fallback={character.fallback} src={getPlayerTrainerSprite(character.id)} /></div>
          <div className="results-trainer-card__stats"><div><span>Player Power</span><strong>{power}</strong></div><div><span>Record</span><strong>{totalWins}/{totalBattles}</strong></div></div>
          <section className="results-trainer-card__badges"><strong>Badges</strong><div className="results-trainer-card__badge-grid">{earnedBadges.map((badge) => <LocalSprite alt={badge} className="results-trainer-card__badge" fallback={badge.slice(0, 2)} key={badge} src={BADGE_IMAGE_PATHS[badge]} />)}</div></section>
        </article>
        <section className="results-team-section"><h2>Final Pokemon Team</h2><div className="results-team-grid">{team.map((pokemon) => <article className="results-pokemon-summary-card" key={pokemon.id}><div className="results-pokemon-summary-card__sprite-wrap"><img alt={pokemon.name} className="results-pokemon-summary-card__sprite" src={pokemon.image} /></div><strong>{pokemon.name}</strong><span>BST {pokemon.base_stat_total}</span></article>)}</div></section>
        <section className="final-results-section"><h2>Completed Trainers</h2><div className="progression-card-grid">{encounters.filter((entry) => entry.opponent.type === "regular").map((entry) => <ProgressionCard key={entry.id} breakdown={createArcadeBreakdown(entry.opponent, entry.outcome, power)} detailItems={entry.opponentTeam.map((pokemon) => pokemon.name)} meta={entry.opponent} spriteSrc={entry.opponent.sprite} status={entry.outcome === "Beat" ? "cleared" : "failed"} />)}</div></section>
        <section className="final-results-section"><h2>Gym Leaders, Elite Four and Champion</h2><div className="progression-card-grid">{majorResults.map(({ opponent }) => { const encounter = encounters.find((entry) => entry.opponent.id === opponent.id); return <ProgressionCard key={opponent.id} breakdown={encounter ? createArcadeBreakdown(opponent, encounter.outcome, power) : undefined} meta={opponent} status={encounter ? (encounter.outcome === "Beat" ? "cleared" : "failed") : "not-reached"} showBadge={opponent.type === "gym-leader"} isLocked={!encounter} />; })}</div></section>
        <div className="trainer-card-actions"><button className="primary-action" type="button" onClick={onTryAgain}>TRY AGAIN</button><button className="secondary-action" type="button" onClick={onMainMenu}>MAIN MENU</button></div>
      </section>
    </main>
  );
}

function namesToPokemon(names: string[], catalogue: Pokemon[]) {
  return names.map((name) => catalogue.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase())).filter((pokemon): pokemon is Pokemon => Boolean(pokemon));
}

function averagePower(team: Pokemon[]) {
  if (team.length === 0) return 0;
  return team.reduce((total, pokemon) => total + pokemon.base_stat_total, 0) / team.length;
}
