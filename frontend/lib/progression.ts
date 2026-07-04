import type { OpponentBreakdown } from "@/types/pokemon";

export type OpponentMeta = {
  name: string;
  stage: string;
  number?: number;
  specialty: string;
  badge?: string;
  pokemonCount: number;
  fallback: string;
};

export type BattleStatus = "pending" | "cleared" | "failed" | "not-reached";

export const GYM_LEADERS: OpponentMeta[] = [
  {
    name: "Brock",
    stage: "Gym Leader 1",
    number: 1,
    specialty: "Rock",
    badge: "Boulder Badge",
    pokemonCount: 2,
    fallback: "B",
  },
  {
    name: "Misty",
    stage: "Gym Leader 2",
    number: 2,
    specialty: "Water",
    badge: "Cascade Badge",
    pokemonCount: 2,
    fallback: "M",
  },
  {
    name: "Lt. Surge",
    stage: "Gym Leader 3",
    number: 3,
    specialty: "Electric",
    badge: "Thunder Badge",
    pokemonCount: 3,
    fallback: "LS",
  },
  {
    name: "Erika",
    stage: "Gym Leader 4",
    number: 4,
    specialty: "Grass",
    badge: "Rainbow Badge",
    pokemonCount: 4,
    fallback: "E",
  },
  {
    name: "Koga",
    stage: "Gym Leader 5",
    number: 5,
    specialty: "Poison",
    badge: "Soul Badge",
    pokemonCount: 4,
    fallback: "K",
  },
  {
    name: "Sabrina",
    stage: "Gym Leader 6",
    number: 6,
    specialty: "Psychic",
    badge: "Marsh Badge",
    pokemonCount: 4,
    fallback: "S",
  },
  {
    name: "Blaine",
    stage: "Gym Leader 7",
    number: 7,
    specialty: "Fire",
    badge: "Volcano Badge",
    pokemonCount: 4,
    fallback: "B",
  },
  {
    name: "Giovanni",
    stage: "Gym Leader 8",
    number: 8,
    specialty: "Ground",
    badge: "Earth Badge",
    pokemonCount: 5,
    fallback: "G",
  },
];

export const ELITE_FOUR: OpponentMeta[] = [
  {
    name: "Lorelei",
    stage: "Elite Four 1",
    specialty: "Ice / Water",
    pokemonCount: 5,
    fallback: "L",
  },
  {
    name: "Bruno",
    stage: "Elite Four 2",
    specialty: "Fighting / Rock",
    pokemonCount: 5,
    fallback: "B",
  },
  {
    name: "Agatha",
    stage: "Elite Four 3",
    specialty: "Ghost / Poison",
    pokemonCount: 5,
    fallback: "A",
  },
  {
    name: "Lance",
    stage: "Elite Four 4",
    specialty: "Dragon / Flying",
    pokemonCount: 5,
    fallback: "L",
  },
];

export const CHAMPION: OpponentMeta = {
  name: "Gary",
  stage: "Champion",
  specialty: "Mixed",
  pokemonCount: 6,
  fallback: "G",
};

export function findBreakdown(
  breakdowns: OpponentBreakdown[] | undefined,
  name: string,
) {
  return breakdowns?.find((opponent) => opponent.opponent_name === name);
}

export function getBattleStatus(
  breakdown: OpponentBreakdown | undefined,
  reached: boolean,
): BattleStatus {
  if (!reached) {
    return "not-reached";
  }

  return breakdown?.outcome === "Beat" ? "cleared" : "failed";
}

export function didBeatOpponent(breakdown: OpponentBreakdown | undefined) {
  return breakdown?.outcome === "Beat";
}

export function formatBattleOutcome(
  status: BattleStatus,
  breakdown: OpponentBreakdown | undefined,
) {
  if (status === "pending") {
    return "";
  }
  if (status === "not-reached") {
    return "";
  }

  return breakdown?.outcome === "Beat" ? "DEFEATED" : "WIPED OUT";
}
