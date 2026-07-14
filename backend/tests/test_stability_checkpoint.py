import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.pokemon_service import get_all_pokemon
from app.services.team_scoring import BADGES_REQUIRED, score_team


CLIENT = TestClient(app)
VALID_TEAM = [
    "Venusaur",
    "Charizard",
    "Blastoise",
    "Alakazam",
    "Golem",
    "Jolteon",
]
DATA_DIR = Path(__file__).resolve().parents[1] / "app" / "data"
SEMANTIC_THREAT_LABELS = {"Starter ace"}


def test_health_endpoint_is_available():
    response = CLIENT.get("/health")
    assert response.status_code == 200


def test_pokemon_endpoint_returns_generation_one_catalogue():
    response = CLIENT.get("/pokemon")
    assert response.status_code == 200
    pokemon = response.json()
    assert len(pokemon) == 151
    assert {entry["id"] for entry in pokemon} == set(range(1, 152))
    assert all(entry["generation"] == 1 for entry in pokemon)


def test_team_score_endpoint_returns_complete_progression_payload():
    response = CLIENT.post("/teams/score", json={"pokemon_names": VALID_TEAM})
    assert response.status_code == 200
    result = response.json()

    assert len(result["selected_pokemon"]) == 6
    assert result["badges_required"] == BADGES_REQUIRED == 8
    assert len(result["opponent_breakdown"]["gym_leaders"]) == 8
    assert len(result["opponent_breakdown"]["elite_four"]) == 4
    assert len(result["opponent_breakdown"]["champion"]) == 1


def test_team_must_have_exactly_six_unique_known_pokemon():
    with pytest.raises(ValueError, match="exactly 6"):
        score_team(VALID_TEAM[:5])

    with pytest.raises(ValueError, match="duplicate"):
        score_team(["Pikachu"] * 6)

    with pytest.raises(ValueError, match="Unknown or unsupported"):
        score_team([*VALID_TEAM[:5], "MissingNo"])


def test_seeded_random_source_makes_scoring_reproducible():
    first = score_team(VALID_TEAM, random_number_generator=lambda: 0.42)
    second = score_team(VALID_TEAM, random_number_generator=lambda: 0.42)
    assert first == second


def test_progression_locks_every_opponent_after_first_loss():
    result = score_team(VALID_TEAM, random_number_generator=lambda: 0.999999)
    progression = (
        result["opponent_breakdown"]["gym_leaders"]
        + result["opponent_breakdown"]["elite_four"]
        + result["opponent_breakdown"]["champion"]
    )

    first_loss_index = next(
        index
        for index, battle in enumerate(progression)
        if battle["outcome"] == "Lost" and battle["win_type"] != "locked"
    )
    assert all(
        battle["win_type"] == "locked" and battle["win_chance"] == 0
        for battle in progression[first_loss_index + 1 :]
    )


def test_win_chance_caps_are_never_exceeded():
    result = score_team(VALID_TEAM, random_number_generator=lambda: 0.0)
    gym_and_elite = (
        result["opponent_breakdown"]["gym_leaders"]
        + result["opponent_breakdown"]["elite_four"]
    )
    champion = result["opponent_breakdown"]["champion"][0]

    assert all(0 <= battle["win_chance"] <= 0.95 for battle in gym_and_elite)
    assert 0 <= champion["win_chance"] <= 0.90


def test_progression_data_is_complete_unique_and_references_real_pokemon():
    catalogue = get_all_pokemon()
    pokemon_names = {pokemon["name"] for pokemon in catalogue}

    gym_leaders = _load_json("gym_leaders.json")
    elite_four = _load_json("elite_four.json")
    champion = _load_json("champion.json")

    assert len(gym_leaders) == 8
    assert len(elite_four) == 4
    assert len(champion) == 1
    assert len({leader["badge_name"] for leader in gym_leaders}) == 8

    opponents = gym_leaders + elite_four + champion
    assert len({opponent["name"] for opponent in opponents}) == len(opponents)

    for opponent in opponents:
        assert opponent["stage"]
        assert opponent["specialty_types"]
        assert opponent["key_threats"]
        concrete_threats = set(opponent["key_threats"]) - SEMANTIC_THREAT_LABELS
        assert concrete_threats.issubset(pokemon_names)
        assert opponent["recommended_counter_types"]


def _load_json(filename: str):
    with (DATA_DIR / filename).open("r", encoding="utf-8") as file:
        return json.load(file)
