from fastapi.testclient import TestClient

from app.main import app
from app.services import team_scoring


client = TestClient(app)


STRONG_BALANCED_TEAM = [
    "Venusaur",
    "Blastoise",
    "Charizard",
    "Raichu",
    "Alakazam",
    "Dragonite",
]

ELITE_TEAM = [
    "Mewtwo",
    "Dragonite",
    "Snorlax",
    "Lapras",
    "Jolteon",
    "Rhydon",
]

TYPE_COVERAGE_TEAM = [
    "Jolteon",
    "Vaporeon",
    "Lapras",
    "Alakazam",
    "Rhydon",
    "Arcanine",
]

WEAK_TEAM = [
    "Bulbasaur",
    "Charmander",
    "Squirtle",
    "Pikachu",
    "Ivysaur",
    "Charmeleon",
]

SHARED_WEAKNESS_TEAM = [
    "Charizard",
    "Moltres",
    "Pidgeot",
    "Fearow",
    "Butterfree",
    "Dragonite",
]


def test_score_valid_six_pokemon_team_keeps_api_shape(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring.random, "random", lambda: 0.0)

    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] > 0
    assert data["result"]
    assert len(data["selected_pokemon"]) == 6
    assert set(data["score_breakdown"]) == {
        "base_stat_strength",
        "type_balance",
        "journey_coverage",
        "weakness_management",
        "matchup_spread",
    }
    assert set(data["battle_score_breakdown"]) >= {
        "team_power",
        "type_advantage",
        "weakness_control",
        "team_balance",
        "ace_factor",
    }
    assert "gym_score" in data
    assert "elite_four_score" in data
    assert "champion_score" in data
    assert data["badges_required"] == 8
    assert isinstance(data["badges_earned"], list)
    assert isinstance(data["elite_four_unlocked"], bool)
    assert data["path_result"]
    assert data["explanation"]
    assert isinstance(data["warnings"], list)


def test_scoring_includes_battle_diagnostics(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring.random, "random", lambda: 0.0)

    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    brock = response.json()["opponent_breakdown"]["gym_leaders"][0]
    assert brock["opponent_name"] == "Brock"
    assert brock["stage"] == "Gym Leader 1"
    assert brock["badge_name"] == "Boulder Badge"
    assert brock["badge_earned"] is True
    assert brock["win_type"] in {"normal", "locked", "loss"}
    assert brock["lucky_win"] is False
    assert brock["lucky_win_chance"] == 0
    assert "matchup_score" in brock
    assert "battle_score" in brock
    assert "raw_battle_score" in brock
    assert "adjusted_battle_score" in brock
    assert "difficulty" in brock
    assert "score_difference" in brock
    assert "win_chance" in brock
    assert "fatigue_penalty" in brock
    assert "opponent_threat_penalty" in brock
    assert "champion_pressure_penalty" in brock
    assert "was_chance_battle" in brock
    assert "roll" in brock
    assert "random_roll" in brock
    assert brock["explanation"]


def test_scoring_includes_badge_names(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring.random, "random", lambda: 0.0)

    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    gym_breakdown = response.json()["opponent_breakdown"]["gym_leaders"]
    assert [leader["badge_name"] for leader in gym_breakdown] == [
        "Boulder Badge",
        "Cascade Badge",
        "Thunder Badge",
        "Rainbow Badge",
        "Soul Badge",
        "Marsh Badge",
        "Volcano Badge",
        "Earth Badge",
    ]


def test_type_coverage_alone_does_not_guarantee_champion_win() -> None:
    data = team_scoring.score_team(TYPE_COVERAGE_TEAM, random_number_generator=lambda: 0.0)
    champion = data["opponent_breakdown"]["champion"][0]

    assert len(data["badges_earned"]) == 8
    assert data["elite_four_unlocked"] is True
    assert champion["opponent_name"] == "Gary"
    assert champion["outcome"] == "Lost"
    assert champion["win_chance"] == 0
    assert data["result"] == "Lose - Pokemon Expert"


def test_strong_balanced_team_can_reach_champion_but_not_auto_beat_gary() -> None:
    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.0,
    )
    champion = data["opponent_breakdown"]["champion"][0]

    assert len(data["badges_earned"]) == 8
    assert data["elite_four_unlocked"] is True
    assert all(
        opponent["outcome"] == "Beat"
        for opponent in data["opponent_breakdown"]["elite_four"]
    )
    assert champion["win_type"] == "loss"
    assert champion["outcome"] == "Lost"
    assert data["result"] == "Lose - Pokemon Expert"


def test_champion_win_is_possible_but_difficult() -> None:
    data = team_scoring.score_team(ELITE_TEAM, random_number_generator=lambda: 0.0)
    champion = data["opponent_breakdown"]["champion"][0]

    assert champion["outcome"] == "Beat"
    assert 0 < champion["win_chance"] < 0.95
    assert champion["was_chance_battle"] is True
    assert data["result"] == "Win - Pokemon Champion"


def test_weak_teams_fail_early() -> None:
    data = team_scoring.score_team(WEAK_TEAM, random_number_generator=lambda: 0.99)
    gym_breakdown = data["opponent_breakdown"]["gym_leaders"]

    assert data["badges_earned"] == []
    assert gym_breakdown[0]["outcome"] == "Lost"
    assert all(opponent["win_type"] == "locked" for opponent in gym_breakdown[1:])
    assert data["elite_four_unlocked"] is False
    assert data["result"] == "Lose - Beginner"


def test_fatigue_reduces_late_stage_success() -> None:
    team = team_scoring._validate_team(STRONG_BALANCED_TEAM)
    early_opponent = {
        "name": "Brock",
        "stage": "Gym Leader 1",
        "specialty_types": ["Normal"],
        "recommended_counter_types": ["Water", "Grass"],
    }
    late_opponent = {
        "name": "Test Champion",
        "stage": "Champion",
        "specialty_types": ["Normal"],
        "recommended_counter_types": ["Water", "Grass"],
    }

    early = team_scoring._calculate_battle_scoring(team, early_opponent)
    late = team_scoring._calculate_battle_scoring(team, late_opponent)

    assert early["raw_battle_score"] == late["raw_battle_score"]
    assert late["fatigue_penalty"] > early["fatigue_penalty"]
    assert late["adjusted_battle_score"] < early["adjusted_battle_score"]


def test_shared_weakness_teams_are_punished() -> None:
    shared_team = team_scoring._validate_team(SHARED_WEAKNESS_TEAM)
    balanced_team = team_scoring._validate_team(STRONG_BALANCED_TEAM)
    brock = {
        "name": "Brock",
        "stage": "Gym Leader 1",
        "specialty_types": ["Rock"],
        "recommended_counter_types": ["Water", "Grass", "Fighting", "Ground"],
    }

    assert (
        team_scoring._score_weakness_control(shared_team, brock)
        < team_scoring._score_weakness_control(balanced_team, brock)
    )


def test_random_rolls_are_deterministic_in_tests(monkeypatch) -> None:
    monkeypatch.setattr(
        team_scoring,
        "_calculate_battle_scoring",
        lambda *_: _fake_scoring(adjusted_battle_score=50, difficulty=50),
    )

    win = team_scoring._score_opponent(
        _fake_team(),
        _fake_opponent("Misty"),
        random_number_generator=lambda: 0.64,
    )
    loss = team_scoring._score_opponent(
        _fake_team(),
        _fake_opponent("Misty"),
        random_number_generator=lambda: 0.65,
    )

    assert win["win_chance"] == 0.65
    assert win["outcome"] == "Beat"
    assert win["roll"] == 0.64
    assert loss["outcome"] == "Lost"
    assert loss["roll"] == 0.65


def test_gym_progression_stops_after_a_loss(monkeypatch) -> None:
    scores = {
        "Brock": 60,
        "Misty": 20,
        "Lt. Surge": 100,
        "Erika": 100,
        "Koga": 100,
        "Sabrina": 100,
        "Blaine": 100,
        "Giovanni": 100,
    }
    difficulties = {"Brock": 40, "Misty": 45}

    monkeypatch.setattr(
        team_scoring,
        "_calculate_battle_scoring",
        lambda _team, opponent: _fake_scoring(
            scores.get(opponent["name"], 100),
            difficulties.get(opponent["name"], 50),
        ),
    )

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.0,
    )
    gym_breakdown = data["opponent_breakdown"]["gym_leaders"]

    assert data["badges_earned"] == ["Boulder Badge"]
    assert gym_breakdown[0]["win_type"] == "normal"
    assert gym_breakdown[1]["win_type"] == "loss"
    assert all(opponent["win_type"] == "locked" for opponent in gym_breakdown[2:])


def test_elite_four_progression_stops_after_a_loss(monkeypatch) -> None:
    def scoring(_team, opponent):
        if opponent["stage"].startswith("Gym Leader"):
            return _fake_scoring(100, 40)
        if opponent["name"] == "Lorelei":
            return _fake_scoring(90, 73)
        if opponent["name"] == "Bruno":
            return _fake_scoring(40, 75)
        return _fake_scoring(100, 80)

    monkeypatch.setattr(team_scoring, "_calculate_battle_scoring", scoring)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.0,
    )
    elite_four = data["opponent_breakdown"]["elite_four"]

    assert len(data["badges_earned"]) == 8
    assert elite_four[0]["outcome"] == "Beat"
    assert elite_four[1]["win_type"] == "loss"
    assert all(opponent["win_type"] == "locked" for opponent in elite_four[2:])
    assert data["opponent_breakdown"]["champion"][0]["win_type"] == "locked"
    assert data["result"] == "Lose - Pokemon Trainer"


def test_champion_only_unlocks_after_all_elite_four_are_beaten(monkeypatch) -> None:
    def scoring(_team, opponent):
        if opponent["stage"].startswith("Gym Leader"):
            return _fake_scoring(100, 40)
        if opponent["name"] == "Agatha":
            return _fake_scoring(40, 78)
        return _fake_scoring(100, 80)

    monkeypatch.setattr(team_scoring, "_calculate_battle_scoring", scoring)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.0,
    )
    champion = data["opponent_breakdown"]["champion"][0]

    assert data["elite_four_unlocked"] is True
    assert data["opponent_breakdown"]["elite_four"][2]["win_type"] == "loss"
    assert champion["win_type"] == "locked"
    assert champion["outcome"] == "Lost"


def test_pokemon_master_label_requires_no_chance_battles(monkeypatch) -> None:
    monkeypatch.setattr(
        team_scoring,
        "_calculate_battle_scoring",
        lambda *_: _fake_scoring(adjusted_battle_score=100, difficulty=40),
    )

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.94,
    )

    assert data["opponent_breakdown"]["champion"][0]["outcome"] == "Beat"
    assert all(
        opponent["was_chance_battle"] is False
        for group in data["opponent_breakdown"].values()
        for opponent in group
    )
    assert data["result"] == "Win - Pokemon Master"


def test_pokemon_champion_label_allows_close_battles(monkeypatch) -> None:
    def scoring(_team, opponent):
        if opponent["name"] == "Gary":
            return _fake_scoring(adjusted_battle_score=88, difficulty=88)
        return _fake_scoring(adjusted_battle_score=100, difficulty=40)

    monkeypatch.setattr(team_scoring, "_calculate_battle_scoring", scoring)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.0,
    )

    assert data["opponent_breakdown"]["champion"][0]["win_chance"] == 0.65
    assert data["opponent_breakdown"]["champion"][0]["outcome"] == "Beat"
    assert data["result"] == "Win - Pokemon Champion"


def test_duplicate_pokemon_rejected() -> None:
    response = client.post(
        "/teams/score",
        json={
            "pokemon_names": [
                "Charizard",
                "Charizard",
                "Jolteon",
                "Alakazam",
                "Snorlax",
                "Dragonite",
            ]
        },
    )

    assert response.status_code == 400
    assert "duplicate" in response.json()["detail"].lower()


def test_less_than_six_pokemon_rejected() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": ["Charizard", "Lapras", "Jolteon"]},
    )

    assert response.status_code == 400
    assert "exactly 6" in response.json()["detail"]


def test_unknown_pokemon_rejected() -> None:
    response = client.post(
        "/teams/score",
        json={
            "pokemon_names": [
                "Charizard",
                "Lapras",
                "Jolteon",
                "Alakazam",
                "Snorlax",
                "Missingno",
            ]
        },
    )

    assert response.status_code == 400
    assert "unknown" in response.json()["detail"].lower()


def _fake_team() -> list[dict]:
    return [
        {
            "name": f"Pokemon {index}",
            "primary_type": "Normal",
            "secondary_type": None,
            "base_stat_total": 500,
        }
        for index in range(team_scoring.TEAM_SIZE)
    ]


def _fake_opponent(name: str, stage: str = "Gym Leader 1") -> dict:
    return {
        "name": name,
        "stage": stage,
        "specialty_types": ["Rock"],
        "recommended_counter_types": ["Water"],
    }


def _fake_scoring(adjusted_battle_score: int, difficulty: int) -> dict:
    return {
        "score_categories": {
            "team_power": 25,
            "type_advantage": 25,
            "weakness_control": 20,
            "team_balance": 15,
            "ace_factor": 15,
        },
        "raw_battle_score": adjusted_battle_score,
        "adjusted_battle_score": adjusted_battle_score,
        "difficulty": difficulty,
        "score_difference": adjusted_battle_score - difficulty,
        "fatigue_penalty": 0,
        "opponent_threat_penalty": 0,
        "champion_pressure_penalty": 0,
    }
