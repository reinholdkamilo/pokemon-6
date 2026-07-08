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

type BattleFrame = {
  message: string;
  playerPokemon?: Pokemon;
  opponentPokemon?: Pokemon;
  opponentPokemonName: string;
  playerHp: number;
  opponentHp: number;
  playerFainting?: boolean;
  opponentFainting?: boolean;
  playerAction?: boolean;
  opponentAction?: boolean;
  itemEffect?: "potion" | "berry" | "power";
};

const FRAME_MS = 1150;

const TYPE_ADVANTAGE: Record<string, string[]> = {
  Normal: [],
  Fire: ["Grass", "Ice", "Bug"],
  Water: ["Fire", "Rock", "Ground"],
  Electric: ["Water", "Flying"],
  Grass: ["Water", "Rock", "Ground"],
  Ice: ["Grass", "Ground", "Flying", "Dragon"],
  Fighting: ["Normal", "Ice", "Rock"],
  Poison: ["Grass", "Bug"],
  Ground: ["Fire", "Electric", "Poison", "Rock"],
  Flying: ["Grass", "Fighting", "Bug"],
  Psychic: ["Fighting", "Poison"],
  Bug: ["Grass", "Psychic", "Poison"],
  Rock: ["Fire", "Ice", "Flying", "Bug"],
  Ghost: ["Psychic", "Ghost"],
  Dragon: ["Dragon"],
};

export function BattleSimulationScreen({
  trainerProfile,
  selectedPokemon,
  opponent,
  breakdown,
  modeLabel,
  onComplete,
  onMainMenu,
}: BattleSimulationScreenProps) {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const playerName = trainerProfile.name || "Trainer";
  const opponentDisplayName = opponent.name === "Gary" ? "Champion" : opponent.name;
  const status: BattleStatus = breakdown?.outcome === "Beat" ? "cleared" : "failed";
  const playerWinsBattle = status === "cleared";
  const outcomeText = formatBattleOutcome(status, breakdown);

  const pokemonByName = useMemo(() => {
    return new Map(allPokemon.map((pokemon) => [pokemon.name.toLowerCase(), pokemon]));
  }, [allPokemon]);

  const opponentTeam = useMemo(() => {
    return opponent.pokemonTeam.map((name) => pokemonByName.get(name.toLowerCase()) ?? null);
  }, [opponent.pokemonTeam, pokemonByName]);

  const battleFrames = useMemo(() => {
    return buildBattleFrames({
      selectedPokemon,
      opponent,
      opponentTeam,
      playerName,
      opponentDisplayName,
      playerWinsBattle,
      outcomeText,
    });
  }, [selectedPokemon, opponent, opponentTeam, playerName, opponentDisplayName, playerWinsBattle, outcomeText]);

  const currentFrame = battleFrames[Math.min(frameIndex, battleFrames.length - 1)];
  const isIntro = frameIndex === 0;
  const isComplete = frameIndex >= battleFrames.length - 1;

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
    if (isComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => Math.min(current + 1, battleFrames.length - 1));
    }, FRAME_MS);

    return () => window.clearTimeout(timer);
  }, [frameIndex, isComplete, battleFrames.length]);

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
              frame={currentFrame}
              opponent={opponent}
              selectedPokemon={selectedPokemon}
            />
          )}
        </div>

        <div className="battle-text-box" aria-live="polite">
          <p>{currentFrame.message}</p>
          <span className="battle-text-caret" aria-hidden="true">▼</span>
        </div>

        <div className="battle-sim-actions">
          {isComplete ? (
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
        {opponent.pokemonTeam.map((pokemonName, index) => (
          <span className="battle-party-ball" key={`${pokemonName}-${index}`} aria-hidden="true" />
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
  frame: BattleFrame;
  opponent: OpponentMeta;
  selectedPokemon: Pokemon[];
};

function PokemonBattleScene({
  frame,
  opponent,
  selectedPokemon,
}: PokemonBattleSceneProps) {
  return (
    <div className={`pokemon-battle-scene ${frame.itemEffect ? `item-effect-${frame.itemEffect}` : ""}`}>
      <BattleHud
        className="battle-hud-opponent"
        hpPercent={frame.opponentHp}
        name={frame.opponentPokemonName}
      />

      <div className="battle-opponent-sprite-wrap">
        {frame.opponentPokemon?.image ? (
          <img
            alt={frame.opponentPokemon.name}
            className={[
              "battle-pokemon-sprite",
              "battle-opponent-pokemon",
              frame.opponentFainting ? "fainting" : "",
              frame.opponentAction ? "attacking" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            src={frame.opponentPokemon.image}
          />
        ) : (
          <LocalSprite
            alt={`${opponent.name} sprite`}
            className={[
              "battle-pokemon-sprite",
              "battle-opponent-pokemon",
              frame.opponentFainting ? "fainting" : "",
              frame.opponentAction ? "attacking" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            fallback={opponent.fallback}
            src={getTrainerSprite(opponent.name)}
          />
        )}
      </div>

      <div className="battle-player-sprite-wrap">
        {frame.playerPokemon?.image ? (
          <img
            alt={frame.playerPokemon.name}
            className={[
              "battle-pokemon-sprite",
              "battle-player-pokemon",
              frame.playerFainting ? "fainting" : "",
              frame.playerAction ? "attacking" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            src={frame.playerPokemon.image}
          />
        ) : (
          <span className="battle-pokemon-sprite sprite-fallback">?</span>
        )}
      </div>

      <BattleHud
        className="battle-hud-player"
        hpPercent={frame.playerHp}
        name={frame.playerPokemon?.name ?? "Pokemon"}
        rightAligned
      />

      {frame.itemEffect ? <div className="battle-item-flash" aria-hidden="true" /> : null}

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
          <i
            className={hpPercent <= 25 ? "danger" : hpPercent <= 50 ? "warning" : ""}
            style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

type BuildBattleFramesInput = {
  selectedPokemon: Pokemon[];
  opponent: OpponentMeta;
  opponentTeam: Array<Pokemon | null>;
  playerName: string;
  opponentDisplayName: string;
  playerWinsBattle: boolean;
  outcomeText: string;
};

function buildBattleFrames({
  selectedPokemon,
  opponent,
  opponentTeam,
  playerName,
  opponentDisplayName,
  playerWinsBattle,
  outcomeText,
}: BuildBattleFramesInput): BattleFrame[] {
  const firstPlayer = selectedPokemon[0];
  const firstOpponent = opponentTeam[0];
  const frames: BattleFrame[] = [
    {
      message: `${opponentDisplayName.toUpperCase()} wants to fight!`,
      playerPokemon: firstPlayer,
      opponentPokemon: firstOpponent ?? undefined,
      opponentPokemonName: opponent.pokemonTeam[0] ?? "Pokemon",
      playerHp: 100,
      opponentHp: 100,
    },
  ];

  let playerIndex = 0;
  let opponentIndex = 0;
  let playerHp = 100;
  let opponentHp = 100;
  let safety = 0;

  while (
    playerIndex < selectedPokemon.length &&
    opponentIndex < opponent.pokemonTeam.length &&
    safety < 24
  ) {
    safety += 1;

    const playerPokemon = selectedPokemon[playerIndex];
    const opponentPokemon = opponentTeam[opponentIndex];
    const opponentPokemonName = opponent.pokemonTeam[opponentIndex] ?? "Pokemon";
    const duelScore = matchupScore(playerPokemon, opponentPokemon, opponentPokemonName, safety);
    const needPlayerWin =
      playerWinsBattle && opponentIndex >= opponent.pokemonTeam.length - 1;
    const needOpponentWin =
      !playerWinsBattle && playerIndex >= selectedPokemon.length - 1;

    let playerWinsDuel = duelScore >= 0;

    if (needPlayerWin) {
      playerWinsDuel = true;
    }

    if (needOpponentWin) {
      playerWinsDuel = false;
    }

    const playerDamage = getDamageAmount({
      attackerWins: playerWinsDuel,
      score: duelScore,
      attacker: playerPokemon,
      defender: opponentPokemon,
      step: safety,
    });
    const opponentDamage = getDamageAmount({
      attackerWins: !playerWinsDuel,
      score: -duelScore,
      attacker: opponentPokemon,
      defender: playerPokemon,
      step: safety + 9,
    });

    if (shouldUseItem(opponent.name, opponentPokemonName, safety, playerWinsDuel, opponentHp)) {
      const heal = 22 + deterministicNumber(opponentPokemonName, safety, 14);
      opponentHp = Math.min(100, opponentHp + heal);
      frames.push({
        message: `${opponentDisplayName.toUpperCase()} used a Potion on ${opponentPokemonName.toUpperCase()}!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        itemEffect: "potion",
      });
    }

    if (shouldUseBerry(playerPokemon.name, safety, !playerWinsDuel, playerHp)) {
      const heal = 16 + deterministicNumber(playerPokemon.name, safety, 12);
      playerHp = Math.min(100, playerHp + heal);
      frames.push({
        message: `${playerPokemon.name.toUpperCase()} restored health with a berry!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        itemEffect: "berry",
      });
    }

    if (shouldUsePowerUp(opponentPokemonName, safety, !playerWinsDuel)) {
      frames.push({
        message: `${opponentPokemonName.toUpperCase()} powered up!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        itemEffect: "power",
      });
    }

    if (playerWinsDuel) {
      opponentHp = Math.max(0, opponentHp - playerDamage);
      playerHp = Math.max(18, playerHp - Math.floor(opponentDamage * 0.45));

      frames.push({
        message: `${playerPokemon.name.toUpperCase()} hit ${opponentPokemonName.toUpperCase()} for big damage!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        playerAction: true,
      });

      opponentHp = 0;
      frames.push({
        message: `${opponentPokemonName.toUpperCase()} fainted!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        opponentFainting: true,
      });

      opponentIndex += 1;
      opponentHp = 100;
    } else {
      playerHp = Math.max(0, playerHp - opponentDamage);
      opponentHp = Math.max(18, opponentHp - Math.floor(playerDamage * 0.45));

      frames.push({
        message: `${opponentPokemonName.toUpperCase()} struck back hard!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        opponentAction: true,
      });

      playerHp = 0;
      frames.push({
        message: `${playerPokemon.name.toUpperCase()} fainted!`,
        playerPokemon,
        opponentPokemon: opponentPokemon ?? undefined,
        opponentPokemonName,
        playerHp,
        opponentHp,
        playerFainting: true,
      });

      playerIndex += 1;
      playerHp = 100;
    }
  }

  frames.push({
    message: playerWinsBattle
      ? `${opponentDisplayName.toUpperCase()} was ${outcomeText || "DEFEATED"}!`
      : `${playerName.toUpperCase()} was ${outcomeText || "WIPED OUT"}!`,
    playerPokemon: selectedPokemon[Math.min(playerIndex, selectedPokemon.length - 1)],
    opponentPokemon: opponentTeam[Math.min(opponentIndex, opponentTeam.length - 1)] ?? undefined,
    opponentPokemonName:
      opponent.pokemonTeam[Math.min(opponentIndex, opponent.pokemonTeam.length - 1)] ?? "Pokemon",
    playerHp: playerWinsBattle ? Math.max(22, playerHp) : 0,
    opponentHp: playerWinsBattle ? 0 : Math.max(22, opponentHp),
  });

  return frames;
}

function matchupScore(
  playerPokemon: Pokemon,
  opponentPokemon: Pokemon | null,
  opponentPokemonName: string,
  step: number,
) {
  const opponentBaseStat = opponentPokemon?.base_stat_total ?? 440;
  const statScore = playerPokemon.base_stat_total - opponentBaseStat;
  const typeScore = getTypeScore(playerPokemon, opponentPokemon);
  const jitter = deterministicNumber(`${playerPokemon.name}-${opponentPokemonName}`, step, 45) - 22;

  return statScore * 0.35 + typeScore + jitter;
}

function getTypeScore(playerPokemon: Pokemon, opponentPokemon: Pokemon | null) {
  if (!opponentPokemon) {
    return 0;
  }

  let score = 0;
  const playerTypes = [playerPokemon.primary_type, playerPokemon.secondary_type].filter(
    Boolean,
  ) as string[];
  const opponentTypes = [opponentPokemon.primary_type, opponentPokemon.secondary_type].filter(
    Boolean,
  ) as string[];

  for (const playerType of playerTypes) {
    for (const opponentType of opponentTypes) {
      if (TYPE_ADVANTAGE[playerType]?.includes(opponentType)) {
        score += 32;
      }

      if (TYPE_ADVANTAGE[opponentType]?.includes(playerType)) {
        score -= 32;
      }
    }
  }

  return score;
}

function getDamageAmount({
  attackerWins,
  score,
  attacker,
  defender,
  step,
}: {
  attackerWins: boolean;
  score: number;
  attacker?: Pokemon | null;
  defender?: Pokemon | null;
  step: number;
}) {
  const statGap = ((attacker?.base_stat_total ?? 430) - (defender?.base_stat_total ?? 430)) / 18;
  const advantage = Math.max(-18, Math.min(24, score / 3));
  const randomPart = deterministicNumber(`${attacker?.name ?? "A"}-${defender?.name ?? "D"}`, step, 18);
  const base = attackerWins ? 54 : 24;

  return Math.max(18, Math.min(95, Math.round(base + statGap + advantage + randomPart)));
}

function shouldUseItem(
  opponentName: string,
  pokemonName: string,
  step: number,
  playerWinsDuel: boolean,
  currentHp: number,
) {
  return (
    currentHp <= 55 &&
    playerWinsDuel &&
    step % 3 === 0 &&
    deterministicNumber(`${opponentName}-${pokemonName}`, step, 10) > 4
  );
}

function shouldUseBerry(
  pokemonName: string,
  step: number,
  playerBehind: boolean,
  currentHp: number,
) {
  return (
    currentHp <= 45 &&
    playerBehind &&
    step % 4 === 0 &&
    deterministicNumber(`berry-${pokemonName}`, step, 10) > 5
  );
}

function shouldUsePowerUp(pokemonName: string, step: number, opponentBehind: boolean) {
  return (
    opponentBehind &&
    step % 5 === 0 &&
    deterministicNumber(`power-${pokemonName}`, step, 10) > 6
  );
}

function deterministicNumber(seed: string, step: number, max: number) {
  const text = `${seed}-${step}`;
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 9973;
  }

  return Math.abs(hash) % max;
}
