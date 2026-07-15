import { CHAMPION, ELITE_FOUR, GYM_LEADERS, type OpponentMeta } from "@/lib/progression";
import type { OpponentBreakdown, Pokemon, TeamScoreResult } from "@/types/pokemon";

export const REGULAR_WINS_PER_GYM = 5;
export const EVOLUTION_WIN_INTERVAL = 4;

export type ArcadeOpponentType = "regular" | "gym-leader" | "elite-four" | "champion";

export type ArcadeTrainer = OpponentMeta & {
  id: string;
  sprite: string;
  type: ArcadeOpponentType;
};

export type ArcadeEncounter = {
  id: string;
  opponent: ArcadeTrainer;
  opponentTeam: Pokemon[];
  outcome: "Beat" | "Lost";
};

export const REGULAR_TRAINERS: ArcadeTrainer[] = [
  ["ace-trainer", "Ace Trainer"],
  ["beauty", "Beauty"],
  ["biker", "Biker"],
  ["bird-keeper", "Bird Keeper"],
  ["black-belt", "Black Belt"],
  ["bug-catcher", "Bug Catcher"],
  ["camper", "Camper"],
  ["channeler", "Channeler"],
  ["fisherman", "Fisherman"],
  ["hiker", "Hiker"],
  ["juggler", "Juggler"],
  ["lass", "Lass"],
  ["picnicker", "Picnicker"],
  ["sailor", "Sailor"],
  ["scientist", "Scientist"],
  ["swimmer", "Swimmer"],
  ["tamer", "Tamer"],
  ["youngster", "Youngster"],
].map(([id, name], index) => ({
  id,
  name,
  stage: "Arcade Trainer",
  number: index + 1,
  specialty: "Hidden team",
  pokemonCount: 2,
  pokemonTeam: [],
  fallback: name.slice(0, 2).toUpperCase(),
  sprite: `/images/trainers/adventure/${id}.png`,
  type: "regular" as const,
}));

export function createMajorTrainer(meta: OpponentMeta, type: Exclude<ArcadeOpponentType, "regular">): ArcadeTrainer {
  return {
    ...meta,
    id: `${type}:${meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    sprite: "",
    type,
  };
}

export function getPredeterminedMajorResults(result: TeamScoreResult) {
  const gym = GYM_LEADERS.map((opponent) => ({
    opponent: createMajorTrainer(opponent, "gym-leader"),
    breakdown: findResult(result.opponent_breakdown?.gym_leaders, opponent.name),
  }));
  const elite = ELITE_FOUR.map((opponent) => ({
    opponent: createMajorTrainer(opponent, "elite-four"),
    breakdown: findResult(result.opponent_breakdown?.elite_four, opponent.name),
  }));
  const champion = [{
    opponent: createMajorTrainer(CHAMPION, "champion"),
    breakdown: findResult(result.opponent_breakdown?.champion, CHAMPION.name),
  }];
  return [...gym, ...elite, ...champion];
}

export function getStrictEndpointId(result: TeamScoreResult) {
  const firstLoss = getPredeterminedMajorResults(result).find(({ breakdown }) => breakdown?.outcome !== "Beat");
  return firstLoss?.opponent.id ?? "complete";
}

export function getRegularTeamSize(gymIndex: number) {
  if (gymIndex <= 0) return randomBetween(2, 3);
  if (gymIndex <= 2) return 3;
  if (gymIndex <= 4) return randomBetween(3, 4);
  if (gymIndex <= 6) return randomBetween(4, 5);
  return randomBetween(5, 6);
}

export function chooseOpponentTeam(catalogue: Pokemon[], size: number, playerPower: number, stageIndex: number) {
  const target = Math.max(250, Math.round(playerPower * (0.58 + stageIndex * 0.025)));
  const ordered = [...catalogue]
    .map((pokemon) => ({ pokemon, distance: Math.abs(pokemon.base_stat_total - target / Math.max(1, size)) + Math.random() * 75 }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ pokemon }) => pokemon);
  const selected: Pokemon[] = [];
  for (const pokemon of ordered) {
    if (!selected.some((item) => item.id === pokemon.id)) selected.push(pokemon);
    if (selected.length === size) break;
  }
  return selected;
}

export function shuffleTrainerCycle(previousId?: string | null) {
  const shuffled = [...REGULAR_TRAINERS].sort(() => Math.random() - 0.5);
  if (previousId && shuffled.length > 1 && shuffled[0].id === previousId) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

export function createArcadeBreakdown(opponent: ArcadeTrainer, outcome: "Beat" | "Lost", playerPower: number): OpponentBreakdown {
  return {
    opponent_name: opponent.name,
    stage: opponent.stage,
    matchup_score: playerPower,
    outcome,
    badge_name: opponent.badge,
    badge_earned: outcome === "Beat" && opponent.type === "gym-leader",
    win_type: outcome === "Beat" ? "normal" : "loss",
    explanation: outcome === "Beat" ? "Arcade progression victory." : "Predetermined Arcade endpoint reached.",
  };
}

function findResult(results: OpponentBreakdown[] | undefined, name: string) {
  return results?.find((entry) => entry.opponent_name === name);
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
