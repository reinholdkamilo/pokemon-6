import json
import random
from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Callable, Optional

from app.services.pokemon_service import get_all_pokemon


TEAM_SIZE = 6
BADGES_REQUIRED = 8

TEAM_POWER_MAX_SCORE = 25
TYPE_ADVANTAGE_MAX_SCORE = 25
WEAKNESS_CONTROL_MAX_SCORE = 20
TEAM_BALANCE_MAX_SCORE = 15
ACE_FACTOR_MAX_SCORE = 15

POWER_SCALE_MIN_BST = 320
POWER_SCALE_MAX_BST = 535
ACE_BST = 500
PARTIAL_ACE_BST = 480
USEFUL_TEAM_MEMBER_BST = 420

OPPONENT_DIFFICULTIES = {
    "Brock": 40,
    "Misty": 45,
    "Lt. Surge": 50,
    "Erika": 55,
    "Koga": 60,
    "Sabrina": 64,
    "Blaine": 67,
    "Giovanni": 70,
    "Lorelei": 73,
    "Bruno": 75,
    "Agatha": 78,
    "Lance": 82,
    "Gary": 88,
}

FATIGUE_PENALTIES = {
    "Gym Leader 1": 0,
    "Gym Leader 2": 1,
    "Gym Leader 3": 2,
    "Gym Leader 4": 3,
    "Gym Leader 5": 4,
    "Gym Leader 6": 5,
    "Gym Leader 7": 6,
    "Gym Leader 8": 7,
    "Elite Four 1": 9,
    "Elite Four 2": 11,
    "Elite Four 3": 13,
    "Elite Four 4": 15,
    "Champion": 18,
}

CHAMPION_THREAT_TYPES = ["Flying", "Psychic", "Ground", "Fire", "Water", "Normal"]
LEGENDARY_POKEMON = {"Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GYM_LEADERS_PATH = DATA_DIR / "gym_leaders.json"
ELITE_FOUR_PATH = DATA_DIR / "elite_four.json"
CHAMPION_PATH = DATA_DIR / "champion.json"

TYPE_WEAKNESSES = {
    "Normal": {"Fighting"},
    "Fire": {"Water", "Ground", "Rock"},
    "Water": {"Electric", "Grass"},
    "Electric": {"Ground"},
    "Grass": {"Fire", "Ice", "Poison", "Flying", "Bug"},
    "Ice": {"Fire", "Fighting", "Rock"},
    "Fighting": {"Flying", "Psychic"},
    "Poison": {"Ground", "Psychic", "Bug"},
    "Ground": {"Water", "Grass", "Ice"},
    "Flying": {"Electric", "Ice", "Rock"},
    "Psychic": {"Bug", "Ghost"},
    "Bug": {"Fire", "Flying", "Rock", "Poison"},
    "Rock": {"Water", "Grass", "Fighting", "Ground"},
    "Ghost": {"Ghost"},
    "Dragon": {"Ice", "Dragon"},
}


def score_team(
    pokemon_names: list[str],
    random_number_generator: Optional[Callable[[], float]] = None,
) -> dict:
    selected_pokemon = _validate_team(pokemon_names)
    rng = random_number_generator or random.random

    gym_breakdown = _score_progression(
        selected_pokemon,
        _load_json(GYM_LEADERS_PATH),
        rng,
        locked_reason="the player lost to an earlier Gym Leader",
    )
    badges_earned = [
        matchup["badge_name"]
        for matchup in gym_breakdown
        if matchup.get("badge_earned")
    ]
    elite_four_unlocked = len(badges_earned) == BADGES_REQUIRED

    elite_four_breakdown = _score_progression(
        selected_pokemon,
        _load_json(ELITE_FOUR_PATH),
        rng,
        initially_locked=not elite_four_unlocked,
        initial_locked_reason="the team has not earned all 8 Gym Badges",
        locked_reason="the player lost to an earlier Elite Four member",
    )
    elite_four_beaten = elite_four_unlocked and all(
        matchup["outcome"] == "Beat" for matchup in elite_four_breakdown
    )

    champion_breakdown = [
        _score_opponent(
            selected_pokemon,
            opponent,
            rng,
            locked=not elite_four_beaten,
            locked_reason=(
                "the team has not beaten all Elite Four members"
                if not elite_four_beaten
                else None
            ),
        )
        for opponent in _load_json(CHAMPION_PATH)
    ]
    champion_beaten = elite_four_beaten and all(
        matchup["outcome"] == "Beat" for matchup in champion_breakdown
    )
    had_chance_battle = any(
        matchup["outcome"] == "Beat" and matchup["was_chance_battle"]
        for matchup in gym_breakdown + elite_four_breakdown + champion_breakdown
    )

    all_breakdowns = gym_breakdown + elite_four_breakdown + champion_breakdown
    battle_score_breakdown = _build_battle_score_breakdown(
        selected_pokemon,
        all_breakdowns,
    )
    score_breakdown = _build_score_breakdown(battle_score_breakdown)
    total_score = _average_matchup_score(all_breakdowns)
    path_result = _build_path_result(
        badges_earned,
        elite_four_unlocked,
        elite_four_beaten,
        champion_beaten,
    )

    return {
        "total_score": total_score,
        "result": _get_result(
            badges_earned,
            elite_four_beaten,
            champion_beaten,
            had_chance_battle,
        ),
        "selected_pokemon": selected_pokemon,
        "score_breakdown": score_breakdown,
        "battle_score_breakdown": battle_score_breakdown,
        "gym_score": _average_matchup_score(gym_breakdown),
        "elite_four_score": _average_matchup_score(elite_four_breakdown),
        "champion_score": _average_matchup_score(champion_breakdown),
        "badges_earned": badges_earned,
        "badges_required": BADGES_REQUIRED,
        "elite_four_unlocked": elite_four_unlocked,
        "path_result": path_result,
        "opponent_breakdown": {
            "gym_leaders": gym_breakdown,
            "elite_four": elite_four_breakdown,
            "champion": champion_breakdown,
        },
        "explanation": _build_explanation(
            total_score,
            battle_score_breakdown,
            badges_earned,
            path_result,
        ),
        "warnings": _build_warnings(
            selected_pokemon,
            battle_score_breakdown,
            badges_earned,
            elite_four_unlocked,
            elite_four_beaten,
            champion_beaten,
        ),
    }


@lru_cache
def _load_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as data_file:
        return json.load(data_file)


def _validate_team(pokemon_names: list[str]) -> list[dict]:
    if len(pokemon_names) != TEAM_SIZE:
        raise ValueError("Team must contain exactly 6 Pokemon.")

    normalized_names = [name.strip().lower() for name in pokemon_names]
    if any(not name for name in normalized_names):
        raise ValueError("Pokemon names cannot be empty.")

    duplicate_names = [
        name for name, count in Counter(normalized_names).items() if count > 1
    ]
    if duplicate_names:
        raise ValueError("Team cannot contain duplicate Pokemon.")

    pokemon_by_name = {
        pokemon["name"].lower(): pokemon
        for pokemon in get_all_pokemon()
        if pokemon["generation"] == 1
    }

    selected_pokemon = []
    for normalized_name in normalized_names:
        pokemon = pokemon_by_name.get(normalized_name)
        if pokemon is None:
            raise ValueError(f"Unknown or unsupported Pokemon: {normalized_name}.")
        selected_pokemon.append(pokemon)

    return selected_pokemon


def _score_progression(
    selected_pokemon: list[dict],
    opponents: list[dict],
    random_number_generator: Callable[[], float],
    initially_locked: bool = False,
    initial_locked_reason: Optional[str] = None,
    locked_reason: Optional[str] = None,
) -> list[dict]:
    breakdowns = []
    progression_stopped = initially_locked
    current_locked_reason = initial_locked_reason

    for opponent in opponents:
        breakdown = _score_opponent(
            selected_pokemon,
            opponent,
            random_number_generator,
            locked=progression_stopped,
            locked_reason=current_locked_reason,
        )
        breakdowns.append(breakdown)

        if breakdown["outcome"] == "Lost" and breakdown["win_type"] != "locked":
            progression_stopped = True
            current_locked_reason = locked_reason

    return breakdowns


def _score_opponent(
    selected_pokemon: list[dict],
    opponent: dict,
    random_number_generator: Optional[Callable[[], float]] = None,
    locked: bool = False,
    locked_reason: Optional[str] = None,
) -> dict:
    scoring = _calculate_battle_scoring(selected_pokemon, opponent)
    roll = None

    if locked:
        beat_opponent = False
        win_type = "locked"
        win_chance = 0
    else:
        win_chance = _get_win_chance(scoring["score_difference"])
        roll = (
            random_number_generator()
            if random_number_generator is not None
            else random.random()
        )
        beat_opponent = roll < win_chance
        win_type = "normal" if beat_opponent else "loss"

    badge_name = opponent.get("badge_name")
    was_chance_battle = not locked and win_chance < 0.95

    breakdown = {
        "opponent_name": opponent["name"],
        "stage": opponent["stage"],
        "matchup_score": scoring["adjusted_battle_score"],
        "battle_score": scoring["adjusted_battle_score"],
        "raw_battle_score": scoring["raw_battle_score"],
        "adjusted_battle_score": scoring["adjusted_battle_score"],
        "difficulty": scoring["difficulty"],
        "score_difference": scoring["score_difference"],
        "win_chance": win_chance,
        "fatigue_penalty": scoring["fatigue_penalty"],
        "opponent_threat_penalty": scoring["opponent_threat_penalty"],
        "champion_pressure_penalty": scoring["champion_pressure_penalty"],
        "was_chance_battle": was_chance_battle,
        "roll": roll,
        "outcome": "Beat" if beat_opponent else "Lost",
        "win_type": win_type,
        "lucky_win": False,
        "lucky_win_chance": 0,
        "random_roll": roll,
        "score_categories": scoring["score_categories"],
        "explanation": _build_opponent_explanation(
            selected_pokemon,
            opponent,
            scoring,
            beat_opponent,
            locked,
            locked_reason,
            win_chance,
        ),
    }

    if badge_name:
        breakdown["badge_name"] = badge_name
        breakdown["badge_earned"] = beat_opponent

    return breakdown


def _calculate_battle_scoring(selected_pokemon: list[dict], opponent: dict) -> dict:
    categories = {
        "team_power": _score_team_power(selected_pokemon),
        "type_advantage": _score_type_advantage(selected_pokemon, opponent),
        "weakness_control": _score_weakness_control(selected_pokemon, opponent),
        "team_balance": _score_team_balance(selected_pokemon),
        "ace_factor": _score_ace_factor(selected_pokemon),
    }
    raw_battle_score = min(100, sum(categories.values()))
    fatigue_penalty = FATIGUE_PENALTIES.get(opponent["stage"], 0)
    opponent_threat_penalty = _score_opponent_threat_penalty(
        selected_pokemon,
        opponent,
    )
    champion_pressure_penalty = _score_champion_pressure_penalty(
        selected_pokemon,
        opponent,
    )
    adjusted_battle_score = max(
        0,
        raw_battle_score
        - fatigue_penalty
        - opponent_threat_penalty
        - champion_pressure_penalty,
    )
    difficulty = OPPONENT_DIFFICULTIES.get(opponent["name"], 70)

    return {
        "score_categories": categories,
        "raw_battle_score": raw_battle_score,
        "adjusted_battle_score": adjusted_battle_score,
        "difficulty": difficulty,
        "score_difference": adjusted_battle_score - difficulty,
        "fatigue_penalty": fatigue_penalty,
        "opponent_threat_penalty": opponent_threat_penalty,
        "champion_pressure_penalty": champion_pressure_penalty,
    }


def _score_team_power(selected_pokemon: list[dict]) -> int:
    return _scale_score(
        _average_base_stat_total(selected_pokemon),
        POWER_SCALE_MIN_BST,
        POWER_SCALE_MAX_BST,
        TEAM_POWER_MAX_SCORE,
    )


def _score_type_advantage(selected_pokemon: list[dict], opponent: dict) -> int:
    recommended_counter_types = set(opponent["recommended_counter_types"])
    useful_pokemon = [
        pokemon
        for pokemon in selected_pokemon
        if _get_pokemon_types(pokemon) & recommended_counter_types
    ]
    useful_counter_types = _get_team_types(useful_pokemon) & recommended_counter_types

    unique_counter_points = _diminishing_points(
        len(useful_counter_types),
        [10, 6, 4, 3, 2],
    )
    answer_depth_points = _diminishing_points(len(useful_pokemon), [4, 3, 2, 1])
    strong_answer_points = min(
        4,
        sum(2 for pokemon in useful_pokemon if pokemon["base_stat_total"] >= 450),
    )

    return min(
        TYPE_ADVANTAGE_MAX_SCORE,
        unique_counter_points + answer_depth_points + strong_answer_points,
    )


def _score_weakness_control(selected_pokemon: list[dict], opponent: dict) -> int:
    highest_shared_weakness = _highest_shared_weakness_count(
        selected_pokemon,
        _get_opponent_threat_types(opponent),
    )
    stage_pressure = _stage_pressure_multiplier(opponent["stage"])

    if highest_shared_weakness >= 4:
        penalty = 16
    elif highest_shared_weakness == 3:
        penalty = 11
    elif highest_shared_weakness == 2:
        penalty = 5
    elif highest_shared_weakness == 1:
        penalty = 1
    else:
        penalty = 0

    return max(
        0,
        WEAKNESS_CONTROL_MAX_SCORE - round(penalty * stage_pressure),
    )


def _score_team_balance(selected_pokemon: list[dict]) -> int:
    primary_type_counts = Counter(pokemon["primary_type"] for pokemon in selected_pokemon)
    unique_primary_types = len(primary_type_counts)
    repeated_slots = sum(count - 1 for count in primary_type_counts.values() if count > 1)
    useful_members = sum(
        1 for pokemon in selected_pokemon if pokemon["base_stat_total"] >= USEFUL_TEAM_MEMBER_BST
    )
    sorted_bst = sorted(
        (pokemon["base_stat_total"] for pokemon in selected_pokemon),
        reverse=True,
    )
    top_two_share = sum(sorted_bst[:2]) / sum(sorted_bst)

    score = round((unique_primary_types / TEAM_SIZE) * 8)
    score += round((useful_members / TEAM_SIZE) * 5)
    score += 2 if top_two_share <= 0.4 else 1 if top_two_share <= 0.45 else 0
    score -= repeated_slots * 2

    return max(0, min(TEAM_BALANCE_MAX_SCORE, score))


def _score_ace_factor(selected_pokemon: list[dict]) -> int:
    score = 0
    for pokemon in selected_pokemon:
        if _is_full_ace(pokemon):
            score += 7 if pokemon["name"] in LEGENDARY_POKEMON else 6
        elif pokemon["base_stat_total"] >= PARTIAL_ACE_BST:
            score += 3

    return min(ACE_FACTOR_MAX_SCORE, score)


def _score_opponent_threat_penalty(selected_pokemon: list[dict], opponent: dict) -> int:
    if _score_type_advantage(selected_pokemon, opponent) >= 12:
        return 0
    stage = opponent["stage"]
    if stage == "Champion":
        return 7
    if stage.startswith("Elite Four"):
        return 5
    if stage in {"Gym Leader 6", "Gym Leader 7", "Gym Leader 8"}:
        return 3
    return 1


def _score_champion_pressure_penalty(selected_pokemon: list[dict], opponent: dict) -> int:
    if opponent["name"] != "Gary":
        return 0

    penalty = 0
    if not any(_is_full_ace(pokemon) for pokemon in selected_pokemon):
        penalty += 8
    if _average_base_stat_total(selected_pokemon) < 420:
        penalty += 8
    if len({pokemon["primary_type"] for pokemon in selected_pokemon}) < 4:
        penalty += 6
    if _highest_shared_weakness_count(selected_pokemon, CHAMPION_THREAT_TYPES) >= 3:
        penalty += 10
    return penalty


def _get_win_chance(score_difference: int) -> float:
    if score_difference >= 12:
        return 0.95
    if score_difference >= 6:
        return 0.80
    if score_difference >= 0:
        return 0.65
    if score_difference >= -5:
        return 0.40
    if score_difference >= -10:
        return 0.20
    if score_difference >= -15:
        return 0.08
    return 0


def _build_battle_score_breakdown(
    selected_pokemon: list[dict],
    opponent_breakdowns: list[dict],
) -> dict[str, int]:
    reached_breakdowns = [
        matchup for matchup in opponent_breakdowns if matchup["win_type"] != "locked"
    ]
    all_opponents = _load_json(GYM_LEADERS_PATH) + _load_json(ELITE_FOUR_PATH)
    all_opponents += _load_json(CHAMPION_PATH)

    team_power = _score_team_power(selected_pokemon)
    type_advantage = round(
        sum(_score_type_advantage(selected_pokemon, opponent) for opponent in all_opponents)
        / len(all_opponents)
    )
    weakness_control = round(
        sum(_score_weakness_control(selected_pokemon, opponent) for opponent in all_opponents)
        / len(all_opponents)
    )
    team_balance = _score_team_balance(selected_pokemon)
    ace_factor = _score_ace_factor(selected_pokemon)
    average_adjusted_score = _average_matchup_score(reached_breakdowns)

    return {
        "team_power": team_power,
        "type_advantage": type_advantage,
        "weakness_control": weakness_control,
        "team_balance": team_balance,
        "ace_factor": ace_factor,
        "average_adjusted_score": average_adjusted_score,
    }


def _build_score_breakdown(battle_score_breakdown: dict[str, int]) -> dict[str, int]:
    return {
        "base_stat_strength": battle_score_breakdown["team_power"],
        "type_balance": battle_score_breakdown["team_balance"],
        "journey_coverage": battle_score_breakdown["type_advantage"],
        "weakness_management": battle_score_breakdown["weakness_control"],
        "matchup_spread": battle_score_breakdown["average_adjusted_score"],
    }


def _get_team_types(selected_pokemon: list[dict]) -> set[str]:
    team_types = set()
    for pokemon in selected_pokemon:
        team_types.update(_get_pokemon_types(pokemon))
    return team_types


def _get_pokemon_types(pokemon: dict) -> set[str]:
    pokemon_types = {pokemon["primary_type"]}
    if pokemon["secondary_type"]:
        pokemon_types.add(pokemon["secondary_type"])
    return pokemon_types


def _get_opponent_threat_types(opponent: dict) -> list[str]:
    if opponent["name"] == "Gary":
        return CHAMPION_THREAT_TYPES
    return [
        threat_type
        for threat_type in opponent["specialty_types"]
        if threat_type != "Mixed"
    ]


def _highest_shared_weakness_count(
    selected_pokemon: list[dict],
    threat_types: list[str],
) -> int:
    if not threat_types:
        return 0
    return max(
        sum(_is_weak_to(pokemon, threat_type) for pokemon in selected_pokemon)
        for threat_type in threat_types
    )


def _is_weak_to(pokemon: dict, attack_type: str) -> bool:
    return any(
        attack_type in TYPE_WEAKNESSES.get(pokemon_type, set())
        for pokemon_type in _get_pokemon_types(pokemon)
    )


def _stage_pressure_multiplier(stage: str) -> float:
    if stage == "Champion":
        return 1.45
    if stage.startswith("Elite Four"):
        return 1.25
    if stage in {"Gym Leader 6", "Gym Leader 7", "Gym Leader 8"}:
        return 1.15
    return 1


def _is_full_ace(pokemon: dict) -> bool:
    return pokemon["name"] in LEGENDARY_POKEMON or pokemon["base_stat_total"] >= ACE_BST


def _average_base_stat_total(selected_pokemon: list[dict]) -> float:
    return sum(pokemon["base_stat_total"] for pokemon in selected_pokemon) / TEAM_SIZE


def _average_matchup_score(opponent_breakdowns: list[dict]) -> int:
    if not opponent_breakdowns:
        return 0
    return round(
        sum(matchup["matchup_score"] for matchup in opponent_breakdowns)
        / len(opponent_breakdowns)
    )


def _scale_score(value: float, minimum: int, maximum: int, max_score: int) -> int:
    if value <= minimum:
        return 0
    if value >= maximum:
        return max_score
    return round(((value - minimum) / (maximum - minimum)) * max_score)


def _diminishing_points(count: int, points: list[int]) -> int:
    return sum(points[: min(count, len(points))])


def _get_result(
    badges_earned: list[str],
    elite_four_beaten: bool,
    champion_beaten: bool,
    had_chance_battle: bool,
) -> str:
    if champion_beaten and not had_chance_battle:
        return "Win - Pokemon Master"
    if champion_beaten:
        return "Win - Pokemon Champion"
    if elite_four_beaten:
        return "Lose - Pokemon Expert"
    if len(badges_earned) == BADGES_REQUIRED:
        return "Lose - Pokemon Trainer"
    return "Lose - Beginner"


def _build_path_result(
    badges_earned: list[str],
    elite_four_unlocked: bool,
    elite_four_beaten: bool,
    champion_beaten: bool,
) -> str:
    if champion_beaten:
        return "Champion Gary beaten"
    if elite_four_beaten:
        return "Elite Four beaten, Champion Gary not beaten"
    if elite_four_unlocked:
        return "All 8 badges earned, Elite Four challenge unlocked"
    return f"{len(badges_earned)}/{BADGES_REQUIRED} badges earned, Elite Four locked"


def _build_opponent_explanation(
    selected_pokemon: list[dict],
    opponent: dict,
    scoring: dict,
    beat_opponent: bool,
    locked: bool,
    locked_reason: Optional[str],
    win_chance: float,
) -> str:
    if locked:
        if locked_reason:
            return f"{opponent['name']} was not reached because {locked_reason}."
        return (
            f"{opponent['name']} is locked because the team has not cleared the "
            "required earlier stage."
        )

    team_types = _get_team_types(selected_pokemon)
    counter_matches = sorted(
        team_types.intersection(opponent["recommended_counter_types"])
    )
    counter_text = ", ".join(counter_matches) if counter_matches else "no direct"
    outcome_text = "beats" if beat_opponent else "does not beat"

    return (
        f"The team {outcome_text} {opponent['name']} with an adjusted "
        f"{scoring['adjusted_battle_score']}/100 battle score against "
        f"{scoring['difficulty']} difficulty. Win chance was "
        f"{round(win_chance * 100)}%. It has {counter_text} counter type "
        f"coverage against {', '.join(opponent['specialty_types'])} threats."
    )


def _build_explanation(
    total_score: int,
    score_breakdown: dict[str, int],
    badges_earned: list[str],
    path_result: str,
) -> str:
    return (
        f"Team averaged {total_score}/100 across reached battles and earned "
        f"{len(badges_earned)}/{BADGES_REQUIRED} badges. {path_result}. "
        f"Power contributed {score_breakdown['team_power']}/"
        f"{TEAM_POWER_MAX_SCORE}, type advantage averaged "
        f"{score_breakdown['type_advantage']}/{TYPE_ADVANTAGE_MAX_SCORE}, "
        f"weakness control averaged {score_breakdown['weakness_control']}/"
        f"{WEAKNESS_CONTROL_MAX_SCORE}, team balance contributed "
        f"{score_breakdown['team_balance']}/{TEAM_BALANCE_MAX_SCORE}, and ace "
        f"factor contributed {score_breakdown['ace_factor']}/"
        f"{ACE_FACTOR_MAX_SCORE}."
    )


def _build_warnings(
    selected_pokemon: list[dict],
    score_breakdown: dict[str, int],
    badges_earned: list[str],
    elite_four_unlocked: bool,
    elite_four_beaten: bool,
    champion_beaten: bool,
) -> list[str]:
    warnings = []
    primary_type_counts = Counter(pokemon["primary_type"] for pokemon in selected_pokemon)
    repeated_primary_types = [
        primary_type
        for primary_type, count in primary_type_counts.items()
        if count > 1
    ]

    if repeated_primary_types:
        warnings.append(
            "Repeated primary types reduce balance: "
            + ", ".join(sorted(repeated_primary_types))
            + "."
        )
    if score_breakdown["type_advantage"] < 12:
        warnings.append("Type coverage is limited across major opponents.")
    if score_breakdown["team_power"] < 12:
        warnings.append("Team base stat strength is low.")
    if score_breakdown["weakness_control"] < 12:
        warnings.append("Shared weaknesses are creating major matchup risk.")
    if not elite_four_unlocked:
        warnings.append("Elite Four is locked until all 8 gym badges are earned.")
    elif not elite_four_beaten:
        warnings.append("Team reached the Elite Four but did not beat all members.")
    elif not champion_beaten:
        warnings.append("Team beat the Elite Four but lost to Champion Gary.")

    return warnings
