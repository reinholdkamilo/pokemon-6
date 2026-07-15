"use client";

import { BattleSimulationScreen } from "@/components/BattleSimulationScreen";
import type { ArcadeTrainer } from "@/lib/arcade";
import type { Pokemon, TrainerProfile } from "@/types/pokemon";

type ArcadeBattleSimulationProps = {
  trainerProfile: TrainerProfile;
  selectedPokemon: Pokemon[];
  opponent: ArcadeTrainer;
  opponentTeam: Pokemon[];
  outcome: "Beat" | "Lost";
  onComplete: () => void;
  onMainMenu: () => void;
};

export function ArcadeBattleSimulation({
  trainerProfile,
  selectedPokemon,
  opponent,
  opponentTeam,
  outcome,
  onComplete,
  onMainMenu,
}: ArcadeBattleSimulationProps) {
  const animationOpponent = {
    ...opponent,
    pokemonCount: opponentTeam.length,
    pokemonTeam: opponentTeam.map((pokemon) => pokemon.name),
  };

  return (
    <div className="arcade-battle-animation">
      <BattleSimulationScreen
        trainerProfile={trainerProfile}
        selectedPokemon={selectedPokemon}
        opponent={animationOpponent}
        breakdown={{
          opponent_name: opponent.name,
          stage: opponent.stage,
          outcome,
          win_type: outcome === "Beat" ? "normal" : "loss",
        }}
        modeLabel={"Arcade Mode" as "Adventure Mode"}
        onComplete={onComplete}
        onMainMenu={onMainMenu}
      />
      <style jsx global>{`
        .arcade-battle-animation .battle-sim-actions .secondary-action {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
