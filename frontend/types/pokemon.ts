export type Pokemon = {
  id: number;
  name: string;
  generation: number;
  primary_type: string;
  secondary_type: string | null;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  base_stat_total: number;
};

export type ScoreBreakdown = {
  base_stat_strength: number;
  type_balance: number;
  elite_four_coverage: number;
  weakness_management: number;
  team_variety: number;
};

export type TeamScoreResult = {
  total_score: number;
  result: string;
  selected_pokemon: Pokemon[];
  score_breakdown: ScoreBreakdown;
  explanation: string;
  warnings: string[];
};
