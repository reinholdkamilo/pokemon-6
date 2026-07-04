from collections import Counter

from app.services.pokemon_service import get_all_pokemon


TEAM_SIZE = 6
ELITE_FOUR_COVERAGE_TYPES = {
    "Electric",
    "Grass",
    "Fighting",
    "Psychic",
    "Ice",
    "Dragon",
    "Water",
    "Rock",
}


def score_team(pokemon_names: list[str]) -> dict:
    selected_pokemon = _validate_team(pokemon_names)

    score_breakdown = {
        "base_stat_strength": _score_base_stat_strength(selected_pokemon),
        "type_balance": _score_type_balance(selected_pokemon),
        "elite_four_coverage": _score_elite_four_coverage(selected_pokemon),
        "weakness_management": _score_weakness_management(selected_pokemon),
        "team_variety": _score_team_variety(selected_pokemon),
    }
    total_score = sum(score_breakdown.values())
    warnings = _build_warnings(selected_pokemon, score_breakdown)

    return {
        "total_score": total_score,
        "result": _get_result(total_score),
        "selected_pokemon": selected_pokemon,
        "score_breakdown": score_breakdown,
        "explanation": _build_explanation(total_score, score_breakdown),
        "warnings": warnings,
    }


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


def _score_base_stat_strength(selected_pokemon: list[dict]) -> int:
    average_base_stat_total = sum(
        pokemon["base_stat_total"] for pokemon in selected_pokemon
    ) / TEAM_SIZE

    if average_base_stat_total >= 525:
        return 40
    if average_base_stat_total >= 475:
        return 34
    if average_base_stat_total >= 425:
        return 28
    if average_base_stat_total >= 375:
        return 20
    return 12


def _score_type_balance(selected_pokemon: list[dict]) -> int:
    primary_types = [pokemon["primary_type"] for pokemon in selected_pokemon]
    unique_primary_types = len(set(primary_types))

    if unique_primary_types == 6:
        return 20
    if unique_primary_types == 5:
        return 18
    if unique_primary_types == 4:
        return 14
    if unique_primary_types == 3:
        return 10
    return 6


def _score_elite_four_coverage(selected_pokemon: list[dict]) -> int:
    team_types = _get_team_types(selected_pokemon)
    covered_types = team_types.intersection(ELITE_FOUR_COVERAGE_TYPES)
    coverage_ratio = len(covered_types) / len(ELITE_FOUR_COVERAGE_TYPES)

    return round(coverage_ratio * 25)


def _score_weakness_management(selected_pokemon: list[dict]) -> int:
    primary_type_counts = Counter(
        pokemon["primary_type"] for pokemon in selected_pokemon
    )
    repeated_type_count = sum(
        count - 1 for count in primary_type_counts.values() if count > 1
    )

    return max(4, 10 - (repeated_type_count * 2))


def _score_team_variety(selected_pokemon: list[dict]) -> int:
    has_physical_attacker = any(
        pokemon["attack"] >= 100 for pokemon in selected_pokemon
    )
    has_special_attacker = any(
        pokemon["special_attack"] >= 100 for pokemon in selected_pokemon
    )
    has_fast_pokemon = any(pokemon["speed"] >= 100 for pokemon in selected_pokemon)
    has_bulky_pokemon = any(
        pokemon["hp"] >= 90 or pokemon["defense"] >= 100
        for pokemon in selected_pokemon
    )
    has_dual_type = any(pokemon["secondary_type"] for pokemon in selected_pokemon)

    return sum(
        [
            has_physical_attacker,
            has_special_attacker,
            has_fast_pokemon,
            has_bulky_pokemon,
            has_dual_type,
        ]
    )


def _get_team_types(selected_pokemon: list[dict]) -> set[str]:
    team_types = set()
    for pokemon in selected_pokemon:
        team_types.add(pokemon["primary_type"])
        if pokemon["secondary_type"]:
            team_types.add(pokemon["secondary_type"])
    return team_types


def _get_result(total_score: int) -> str:
    if total_score >= 85:
        return "Win - Undefeated Champion"
    if total_score >= 70:
        return "Win - Champion, but not undefeated"
    if total_score >= 50:
        return "Lose - Reached Elite Four but lost"
    return "Lose - Team not strong enough"


def _build_explanation(total_score: int, score_breakdown: dict[str, int]) -> str:
    return (
        f"Team scored {total_score}/100. "
        f"Base stats contributed {score_breakdown['base_stat_strength']}/40, "
        f"type balance contributed {score_breakdown['type_balance']}/20, "
        f"Elite Four coverage contributed "
        f"{score_breakdown['elite_four_coverage']}/25, "
        f"weakness management contributed "
        f"{score_breakdown['weakness_management']}/10, "
        f"and team variety contributed {score_breakdown['team_variety']}/5."
    )


def _build_warnings(
    selected_pokemon: list[dict],
    score_breakdown: dict[str, int],
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

    if score_breakdown["elite_four_coverage"] < 15:
        warnings.append("Elite Four coverage is limited.")

    if score_breakdown["base_stat_strength"] < 28:
        warnings.append("Team base stat strength is low.")

    return warnings
