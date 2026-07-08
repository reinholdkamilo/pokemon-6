"use client";

import { useEffect, useMemo, useState } from "react";
import { GameTopBar } from "@/components/GameTopBar";
import { LocalSprite } from "@/components/LocalSprite";
import { getPokemon } from "@/lib/api";
import { getPlayerTrainerSprite, getTrainerSprite } from "@/lib/imagePaths";
import { formatBattleOutcome, type BattleStatus, type OpponentMeta } from "@/lib/progression";
import type { OpponentBreakdown, Pokemon, TrainerProfile } from "@/types/pokemon";

type BattleSimulationScreenProps = {
  trainerProfile: TrainerProfile;
  selectedPokemon: Pokemon[];
  opponent: OpponentMeta;
  breakdown?: OpponentBreakdown;
  modeLabel: "Battle Mode" | "Adventure Mode";
  onComplete: () => void;
  onMainMenu: () => void;
};

const SCENE_MS = 1400;

export function BattleSimulationScreen({
  trainerProfile,
  selectedPokemon,
  opponent,
  breakdown,
  modeLabel,
  onComplete,
  onMainMenu,
}: BattleSimulationScreenProps) {
  const [scene, setScene] = useState(0);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const playerName = trainerProfile.name || "Trainer";
  const opponentDisplayName = opponent.name === "Gary" ? "Champion" : opponent.name;
  const status: BattleStatus = breakdown?.outcome === "Beat" ? "cleared" : "failed";
  const outcomeText = formatBattleOutcome(status, breakdown);
  const rounds = Math.max(selectedPokemon.length, opponent.pokemonTeam.length);
  const battleSceneCount = rounds * 2;
  const isIntro = scene === 0;
  const isResult = scene > battleSceneCount;
  const matchupIndex = Math.min(Math.max(Math.floor((scene - 1) / 2), 0), rounds - 1);
  const isAttackScene = scene > 0 && scene <= battleSceneCount && scene % 2 === 1;
  const isFaintScene = scene > 0 && scene <= battleSceneCount && scene % 2 === 0;

  const pokemonByName = useMemo(() => {
    return new Map(allPokemon.map((pokemon) => [pokemon.name.toLowerCase(), pokemon]));
  }, [allPokemon]);

  const playerPokemon = selectedPokemon[matchupIndex] ?? selectedPokemon[selectedPokemon.length - 1];
  const opponentPokemonName =
    opponent.pokemonTeam[matchupIndex] ?? opponent.pokemonTeam[opponent.pokemonTeam.length - 1];
  const opponentPokemon = pokemonByName.get(opponentPokemonName?.toLowerCase() ?? "");

  const playerWinsBattle = status === "cleared";
  const faintedName = playerWinsBattle
    ? opponentPokemonName
    : playerPokemon?.name ?? playerName;
  const activeMessage = getBattleMessage({
    isIntro,
    isResult,
    isAttackScene,
    isFaintScene,
    opponentDisplayName,
    playerName,
    playerPokemonName: playerPokemon?.name ?? "Pokemon",
    opponentPokemonName: opponentPokemonName ?? "Pokemon",
    faintedName,
    outcomeText,
    playerWinsBattle,
  });

  useEffect(() => {
    let ignoreResult = false;

    getPokemon()
      .then((pokemon) => {
        if (!ignoreResult) {
          setAllPokemon(pokemon);
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          setAllPokemon([]);
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isResult) {
        return;
      }

      setScene((currentScene) => currentScene + 1);
    }, SCENE_MS);

    return () => window.clearTimeout(timer);
  }, [scene, isResult]);

  return (
    <main className="game-shell battle-sim-shell">
      <section className="battle-sim-screen" aria-label={`${opponentDisplayName} battle`}>
        <GameTopBar modeLabel={modeLabel} onMainMenu={onMainMenu} />

        <div className="battle-sim-stage">
          {isIntro ? (
            <TrainerIntroScene
              opponent={opponent}
              opponentDisplayName={opponentDisplayName}
              playerName={playerName}
              trainerProfile={trainerProfile}
              selectedPokemon={selectedPokemon}
            />
          ) : (
            <PokemonBattleScene
              isFaintScene={isFaintScene}
              opponent={opponent}
              opponentPokemon={opponentPokemon}
              opponentPokemonName={opponentPokemonName}
              playerPokemon={playerPokemon}
              playerWinsBattle={playerWinsBattle}
              selectedPokemon={selectedPokemon}
            />
          )}
        </div>

        <div className="battle-text-box" aria-live="polite">
          <p>{activeMessage}</p>
          <span className="battle-text-caret" aria-hidden="true">▼</span>
        </div>

        <div className="battle-sim-actions">
          {isResult ? (
            <button className="primary-action" type="button" onClick={onComplete}>
              CONTINUE
            </button>
          ) : (
            <button className="secondary-action" type="button" onClick={onComplete}>
              SKIP ANIMATION
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

type TrainerIntroSceneProps = {
  opponent: OpponentMeta;
  opponentDisplayName: string;
  playerName: string;
  trainerProfile: TrainerProfile;
  selectedPokemon: Pokemon[];
};

function TrainerIntroScene({
  opponent,
  opponentDisplayName,
  playerName,
  trainerProfile,
  selectedPokemon,
}: TrainerIntroSceneProps) {
  return (
    <div className="battle-intro-scene">
      <div className="battle-party-row opponent-party" aria-label={`${opponentDisplayName} party`}>
        {opponent.pokemonTeam.map((pokemonName) => (
          <span className="battle-party-ball" key={pokemonName} aria-hidden="true" />
        ))}
      </div>

      <LocalSprite
        alt={`${opponentDisplayName} sprite`}
        className="battle-intro-trainer battle-intro-opponent"
        fallback={opponent.fallback}
        src={getTrainerSprite(opponent.name)}
      />

      <LocalSprite
        alt={`${playerName} sprite`}
        className="battle-intro-trainer battle-intro-player"
        fallback="P"
        src={getPlayerTrainerSprite(trainerProfile.sprite)}
      />

      <div className="battle-party-row player-party" aria-label={`${playerName} party`}>
        {selectedPokemon.map((pokemon) => (
          <span className="battle-party-ball" key={pokemon.id} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

type PokemonBattleSceneProps = {
  opponent: OpponentMeta;
  opponentPokemon?: Pokemon;
  opponentPokemonName?: string;
  playerPokemon?: Pokemon;
  selectedPokemon: Pokemon[];
  isFaintScene: boolean;
  playerWinsBattle: boolean;
};

function PokemonBattleScene({
  opponent,
  opponentPokemon,
  opponentPokemonName,
  playerPokemon,
  selectedPokemon,
  isFaintScene,
  playerWinsBattle,
}: PokemonBattleSceneProps) {
  return (
    <div className="pokemon-battle-scene">
      <BattleHud
        className="battle-hud-opponent"
        hpPercent={isFaintScene && playerWinsBattle ? 0 : 72}
        name={opponentPokemonName ?? "Pokemon"}
      />

      <div className="battle-opponent-sprite-wrap">
        {opponentPokemon?.image ? (
          <img
            alt={opponentPokemon.name}
            className={`battle-pokemon-sprite battle-opponent-pokemon${
              isFaintScene && playerWinsBattle ? " fainting" : ""
            }`}
            src={opponentPokemon.image}
          />
        ) : (
          <LocalSprite
            alt={`${opponent.name} sprite`}
            className={`battle-pokemon-sprite battle-opponent-pokemon${
              isFaintScene && playerWinsBattle ? " fainting" : ""
            }`}
            fallback={opponent.fallback}
            src={getTrainerSprite(opponent.name)}
          />
        )}
      </div>

      <div className="battle-player-sprite-wrap">
        {playerPokemon?.image ? (
          <img
            alt={playerPokemon.name}
            className={`battle-pokemon-sprite battle-player-pokemon${
              isFaintScene && !playerWinsBattle ? " fainting" : ""
            }`}
            src={playerPokemon.image}
          />
        ) : (
          <span className="battle-pokemon-sprite sprite-fallback">?</span>
        )}
      </div>

      <BattleHud
        className="battle-hud-player"
        hpPercent={isFaintScene && !playerWinsBattle ? 0 : 74}
        name={playerPokemon?.name ?? "Pokemon"}
        rightAligned
      />

      <div className="battle-party-row battle-player-party">
        {selectedPokemon.map((pokemon) => (
          <span className="battle-party-ball" key={pokemon.id} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

type BattleHudProps = {
  name: string;
  hpPercent: number;
  className: string;
  rightAligned?: boolean;
};

function BattleHud({ name, hpPercent, className, rightAligned = false }: BattleHudProps) {
  return (
    <div className={`battle-hud ${className} ${rightAligned ? "right-aligned" : ""}`}>
      <strong>{name}</strong>
      <span>Lv50</span>
      <div className="battle-hp-row">
        <span>HP:</span>
        <div className="battle-hp-bar">
          <i style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }} />
        </div>
      </div>
    </div>
  );
}

type BattleMessageInput = {
  isIntro: boolean;
  isResult: boolean;
  isAttackScene: boolean;
  isFaintScene: boolean;
  opponentDisplayName: string;
  playerName: string;
  playerPokemonName: string;
  opponentPokemonName: string;
  faintedName: string;
  outcomeText: string;
  playerWinsBattle: boolean;
};

function getBattleMessage({
  isIntro,
  isResult,
  isAttackScene,
  isFaintScene,
  opponentDisplayName,
  playerName,
  playerPokemonName,
  opponentPokemonName,
  faintedName,
  outcomeText,
  playerWinsBattle,
}: BattleMessageInput) {
  if (isIntro) {
    return `${opponentDisplayName.toUpperCase()} wants to fight!`;
  }

  if (isResult) {
    return playerWinsBattle
      ? `${opponentDisplayName.toUpperCase()} was ${outcomeText || "DEFEATED"}!`
      : `${playerName.toUpperCase()} was ${outcomeText || "WIPED OUT"}!`;
  }

  if (isFaintScene) {
    return `${faintedName.toUpperCase()} fainted!`;
  }

  if (isAttackScene) {
    return `${playerPokemonName.toUpperCase()} clashes with ${opponentPokemonName.toUpperCase()}!`;
  }

  return `The battle continues!`;
}
