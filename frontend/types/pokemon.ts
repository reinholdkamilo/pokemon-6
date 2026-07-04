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
  journey_coverage: number;
  weakness_management: number;
  matchup_spread: number;
};

export type OpponentBreakdown = {
  opponent_name: string;
  stage: string;
  badge_name?: string;
  matchup_score: number;
  outcome: string;
  badge_earned?: boolean;
  explanation: string;
};

export type TeamScoreResult = {
  total_score: number;
  result: string;
  selected_pokemon: Pokemon[];
  score_breakdown: ScoreBreakdown;
  gym_score: number;
  elite_four_score: number;
  champion_score: number;
  badges_earned: string[];
  badges_required: number;
  elite_four_unlocked: boolean;
  path_result: string;
  opponent_breakdown: {
    gym_leaders: OpponentBreakdown[];
    elite_four: OpponentBreakdown[];
    champion: OpponentBreakdown[];
  };
  explanation: string;
  warnings: string[];
};
