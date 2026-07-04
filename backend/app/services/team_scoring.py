import json
from collections import Counter
from functools import lru_cache
from pathlib import Path

from app.services.pokemon_service import get_all_pokemon


TEAM_SIZE = 6
BADGES_REQUIRED = 8
BASE_STAT_MAX_SCORE = 30
TYPE_BALANCE_MAX_SCORE = 15
COVERAGE_MAX_SCORE = 20
WEAKNESS_MAX_SCORE = 10
MATCHUP_SPREAD_MAX_SCORE = 25
GYM_WIN_THRESHOLD = 48
ELITE_FOUR_WIN_THRESHOLD = 62
CHAMPION_WIN_THRESHOLD = 70

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GYM_LEADERS_PATH = DATA_DIR / "gym_leaders.json"
ELITE_FOUR_PATH = DATA_DIR / "elite_four.json"
CHAMPION_PATH = DATA_DIR / "champion.json"


def score_team(pokemon_names: list[str]) -> dict:
    selected_pokemon = _validate_team(pokemon_names)
    gym_opponents = _load_json(GYM_LEADERS_PATH)
    elite_four_opponents = _load_json(ELITE_FOUR_PATH)
    champion_opponents = _load_json(CHAMPION_PATH)

    gym_breakdown = [
        _score_opponent(selected_pokemon, opponent, GYM_WIN_THRESHOLD)
        for opponent in gym_opponents
    ]
    badges_earned = [
        matchup["badge_name"]
        for matchup in gym_breakdown
        if matchup["badge_earned"]
    ]
    elite_four_unlocked = len(badges_earned) == BADGES_REQUIRED

    elite_four_breakdown = [
        _score_opponent(
            selected_pokemon,
            opponent,
            ELITE_FOUR_WIN_THRESHOLD,
            locked=not elite_four_unlocked,
        )
        for opponent in elite_four_opponents
    ]
    elite_four_beaten = elite_four_unlocked and all(
        matchup["outcome"] == "Beat" for matchup in elite_four_breakdown
    )

    champion_breakdown = [
        _score_opponent(
            selected_pokemon,
            opponent,
            CHAMPION_WIN_THRESHOLD,
            locked=not elite_four_beaten,
        )
        for opponent in champion_opponents
    ]
    champion_beaten = elite_four_beaten and all(
        matchup["outcome"] == "Beat" for matchup in champion_breakdown
    )

    gym_score = _average_matchup_score(gym_breakdown)
    elite_four_score = _average_matchup_score(elite_four_breakdown)
    champion_score = _average_matchup_score(champion_breakdown)
    score_breakdown = _build_score_breakdown(
        selected_pokemon,
        gym_breakdown + elite_four_breakdown + champion_breakdown,
    )
    total_score = min(100, sum(score_breakdown.values()))
    path_result = _build_path_result(
        badges_earned,
        elite_four_unlocked,
        elite_four_beaten,
        champion_beaten,
    )
    warnings = _build_warnings(
        selected_pokemon,
        score_breakdown,
        badges_earned,
        elite_four_unlocked,
        elite_four_beaten,
        champion_beaten,
    )

    return {
        "total_score": total_score,
        "result": _get_result(
            total_score,
            badges_earned,
            elite_four_beaten,
            champion_beaten,
        ),
        "selected_pokemon": selected_pokemon,
        "score_breakdown": score_breakdown,
        "gym_score": gym_score,
        "elite_four_score": elite_four_score,
        "champion_score": champion_score,
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
            score_breakdown,
            badges_earned,
            path_result,
        ),
        "warnings": warnings,
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


def _score_opponent(
    selected_pokemon: list[dict],
    opponent: dict,
    win_threshold: int,
    locked: bool = False,
) -> dict:
    matchup_score = _calculate_matchup_score(selected_pokemon, opponent)
    beat_opponent = not locked and matchup_score >= win_threshold
    badge_name = opponent.get("badge_name")

    breakdown = {
        "opponent_name": opponent["name"],
        "stage": opponent["stage"],
        "matchup_score": matchup_score,
        "outcome": "Beat" if beat_opponent else "Lost",
        "explanation": _build_opponent_explanation(
            selected_pokemon,
            opponent,
            matchup_score,
            beat_opponent,
            locked,
        ),
    }

    if badge_name:
        breakdown["badge_name"] = badge_name
        breakdown["badge_earned"] = beat_opponent

    return breakdown


def _calculate_matchup_score(selected_pokemon: list[dict], opponent: dict) -> int:
    team_types = _get_team_types(selected_pokemon)
    recommended_counter_types = set(opponent["recommended_counter_types"])
    counter_matches = team_types.intersection(recommended_counter_types)

    average_base_stat_total = _average_base_stat_total(selected_pokemon)
    stat_score = _scale_score(average_base_stat_total, 250, 535, 34)
    counter_score = min(36, len(counter_matches) * 12)
    ace_counter_score = 0
    for pokemon in selected_pokemon:
        pokemon_types = _get_pokemon_types(pokemon)
        if pokemon["base_stat_total"] >= 450 and pokemon_types & counter_matches:
            ace_counter_score += 6
    ace_counter_score = min(18, ace_counter_score)
    balance_score = min(12, len({p["primary_type"] for p in selected_pokemon}) * 2)

    return min(100, stat_score + counter_score + ace_counter_score + balance_score)


def _build_score_breakdown(
    selected_pokemon: list[dict],
    opponent_breakdowns: list[dict],
) -> dict[str, int]:
    return {
        "base_stat_strength": _score_base_stat_strength(selected_pokemon),
        "type_balance": _score_type_balance(selected_pokemon),
        "journey_coverage": _score_journey_coverage(selected_pokemon),
        "weakness_management": _score_weakness_management(selected_pokemon),
        "matchup_spread": _score_matchup_spread(opponent_breakdowns),
    }


def _score_base_stat_strength(selected_pokemon: list[dict]) -> int:
    return _scale_score(
        _average_base_stat_total(selected_pokemon),
        250,
        535,
        BASE_STAT_MAX_SCORE,
    )


def _score_type_balance(selected_pokemon: list[dict]) -> int:
    unique_primary_types = len({pokemon["primary_type"] for pokemon in selected_pokemon})
    return round((unique_primary_types / TEAM_SIZE) * TYPE_BALANCE_MAX_SCORE)


def _score_journey_coverage(selected_pokemon: list[dict]) -> int:
    team_types = _get_team_types(selected_pokemon)
    opponents = _load_json(GYM_LEADERS_PATH) + _load_json(ELITE_FOUR_PATH)
    opponents += _load_json(CHAMPION_PATH)

    opponent_coverage = sum(
        min(
            1,
            len(team_types.intersection(opponent["recommended_counter_types"])) / 1.5,
        )
        for opponent in opponents
    )
    return round((opponent_coverage / len(opponents)) * COVERAGE_MAX_SCORE)


def _score_weakness_management(selected_pokemon: list[dict]) -> int:
    primary_type_counts = Counter(
        pokemon["primary_type"] for pokemon in selected_pokemon
    )
    repeated_type_count = sum(
        count - 1 for count in primary_type_counts.values() if count > 1
    )

    return max(2, WEAKNESS_MAX_SCORE - (repeated_type_count * 2))


def _score_matchup_spread(opponent_breakdowns: list[dict]) -> int:
    average_score = _average_matchup_score(opponent_breakdowns)
    return _scale_score(average_score, 30, 80, MATCHUP_SPREAD_MAX_SCORE)


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


def _get_result(
    total_score: int,
    badges_earned: list[str],
    elite_four_beaten: bool,
    champion_beaten: bool,
) -> str:
    if total_score >= 95 and champion_beaten:
        return "Win - Undefeated Champion"
    if total_score >= 85 and elite_four_beaten and not champion_beaten:
        return "Lose - Beat Gym Leaders and Elite Four, but lost to Champion Gary"
    if total_score >= 75 and len(badges_earned) == BADGES_REQUIRED:
        return "Lose - Beat Gym Leaders, but lost during the Elite Four"
    return "Lose - Did not beat all Gym Leaders"


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
    matchup_score: int,
    beat_opponent: bool,
    locked: bool,
) -> str:
    if locked:
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
        f"The team {outcome_text} {opponent['name']} with a "
        f"{matchup_score}/100 matchup. It has {counter_text} counter type "
        f"coverage against {', '.join(opponent['specialty_types'])} threats."
    )


def _build_explanation(
    total_score: int,
    score_breakdown: dict[str, int],
    badges_earned: list[str],
    path_result: str,
) -> str:
    return (
        f"Team scored {total_score}/100 and earned "
        f"{len(badges_earned)}/{BADGES_REQUIRED} badges. {path_result}. "
        f"Base stats contributed {score_breakdown['base_stat_strength']}/"
        f"{BASE_STAT_MAX_SCORE}, type balance contributed "
        f"{score_breakdown['type_balance']}/{TYPE_BALANCE_MAX_SCORE}, journey "
        f"coverage contributed {score_breakdown['journey_coverage']}/"
        f"{COVERAGE_MAX_SCORE}, weakness management contributed "
        f"{score_breakdown['weakness_management']}/{WEAKNESS_MAX_SCORE}, and "
        f"matchup spread contributed {score_breakdown['matchup_spread']}/"
        f"{MATCHUP_SPREAD_MAX_SCORE}."
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
    primary_type_counts = Counter(
        pokemon["primary_type"] for pokemon in selected_pokemon
    )
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

    if score_breakdown["journey_coverage"] < 12:
        warnings.append("Journey coverage is limited across major opponents.")

    if score_breakdown["base_stat_strength"] < 18:
        warnings.append("Team base stat strength is low.")

    if not elite_four_unlocked:
        warnings.append("Elite Four is locked until all 8 gym badges are earned.")
    elif not elite_four_beaten:
        warnings.append("Team reached the Elite Four but did not beat all members.")
    elif not champion_beaten:
        warnings.append("Team beat the Elite Four but lost to Champion Gary.")

    return warnings
