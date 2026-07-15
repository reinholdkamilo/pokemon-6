import type { OpponentMeta } from "@/lib/progression";
import type { PlayerTrainerGender } from "@/lib/imagePaths";
import type { TrainerProfile } from "@/types/pokemon";

export type PlayerCharacterId = "chaz" | "laga" | "kevin" | "gj";

export type PlayerCharacterOption = {
  id: PlayerCharacterId;
  label: string;
  fallback: string;
  detailItems: string[];
};

export const DEFAULT_PLAYER_CHARACTER_ID: PlayerCharacterId = "chaz";

export const PLAYER_CHARACTERS: PlayerCharacterOption[] = [
  {
    id: "chaz",
    label: "Chaz",
    fallback: "C",
    detailItems: ["Pallet Town"],
  },
  {
    id: "laga",
    label: "Laga",
    fallback: "L",
    detailItems: ["Pallet Town"],
  },
  {
    id: "kevin",
    label: "Kevin",
    fallback: "K",
    detailItems: ["Pallet Town"],
  },
  {
    id: "gj",
    label: "GJ",
    fallback: "GJ",
    detailItems: ["Pallet Town"],
  },
];

export function normalizePlayerCharacterId(
  value: PlayerTrainerGender | TrainerProfile["sprite"] | string | null | undefined,
): PlayerCharacterId {
  if (value === "chaz" || value === "laga" || value === "kevin" || value === "gj") {
    return value;
  }

  if (value === "female" || value === "player-female") {
    return "laga";
  }

  return DEFAULT_PLAYER_CHARACTER_ID;
}

export function getPlayerCharacter(
  value: PlayerTrainerGender | TrainerProfile["sprite"] | string | null | undefined,
) {
  const id = normalizePlayerCharacterId(value);
  return PLAYER_CHARACTERS.find((character) => character.id === id) ?? PLAYER_CHARACTERS[0];
}

export function getPlayerCharacterFallback(
  value: PlayerTrainerGender | TrainerProfile["sprite"] | string | null | undefined,
) {
  return getPlayerCharacter(value).fallback;
}

export function toPlayerCharacterMeta(
  character: PlayerCharacterOption,
  index: number,
): OpponentMeta {
  return {
    name: character.label,
    stage: `Character ${index + 1}`,
    number: index + 1,
    specialty: "Player",
    pokemonCount: 0,
    pokemonTeam: character.detailItems,
    fallback: character.fallback,
  };
}
