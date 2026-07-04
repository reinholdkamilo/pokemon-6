from fastapi.testclient import TestClient
from typing import Optional

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

STRONG_TEAM_WITHOUT_ALL_BADGES = [
    "Charizard",
    "Lapras",
    "Raichu",
    "Alakazam",
    "Snorlax",
    "Dragonite",
]

WEAK_UNBALANCED_TEAM = [
    "Bulbasaur",
    "Charmander",
    "Squirtle",
    "Pikachu",
    "Ivysaur",
    "Charmeleon",
]


def test_score_valid_six_pokemon_team() -> None:
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
    assert "gym_score" in data
    assert "elite_four_score" in data
    assert "champion_score" in data
    assert data["badges_required"] == 8
    assert isinstance(data["badges_earned"], list)
    assert isinstance(data["elite_four_unlocked"], bool)
    assert data["path_result"]
    assert data["explanation"]
    assert isinstance(data["warnings"], list)


def test_scoring_includes_gym_leader_breakdown() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    gym_breakdown = response.json()["opponent_breakdown"]["gym_leaders"]
    assert len(gym_breakdown) == 8
    assert gym_breakdown[0]["opponent_name"] == "Brock"
    assert gym_breakdown[0]["stage"] == "Gym Leader 1"
    assert "matchup_score" in gym_breakdown[0]
    assert "outcome" in gym_breakdown[0]
    assert gym_breakdown[0]["win_type"] in {"normal", "lucky", "locked", "loss"}
    assert gym_breakdown[0]["lucky_win"] is False
    assert "lucky_win_chance" in gym_breakdown[0]
    assert "random_roll" in gym_breakdown[0]
    assert "badge_earned" in gym_breakdown[0]
    assert gym_breakdown[0]["explanation"]


def test_scoring_includes_badge_names() -> None:
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


def test_badges_earned_is_returned() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    assert response.json()["badges_earned"] == [
        "Boulder Badge",
        "Cascade Badge",
        "Thunder Badge",
        "Rainbow Badge",
        "Soul Badge",
        "Marsh Badge",
        "Volcano Badge",
        "Earth Badge",
    ]


def test_elite_four_unlocked_false_when_fewer_than_8_badges(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring.random, "random", lambda: 0.99)

    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_TEAM_WITHOUT_ALL_BADGES},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["badges_earned"]) < 8
    assert data["elite_four_unlocked"] is False
    assert (
        data["opponent_breakdown"]["gym_leaders"][2]["opponent_name"]
        == "Lt. Surge"
    )
    assert data["opponent_breakdown"]["gym_leaders"][2]["win_type"] == "loss"
    assert all(
        opponent["win_type"] == "locked"
        for opponent in data["opponent_breakdown"]["gym_leaders"][3:]
    )
    assert all(
        opponent["outcome"] == "Lost"
        for opponent in data["opponent_breakdown"]["elite_four"]
    )
    assert all(
        opponent["outcome"] == "Lost"
        for opponent in data["opponent_breakdown"]["champion"]
    )


def test_elite_four_unlocked_true_when_all_8_badges_are_earned() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["badges_earned"]) == 8
    assert data["elite_four_unlocked"] is True


def test_scoring_includes_elite_four_breakdown() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    elite_four_breakdown = response.json()["opponent_breakdown"]["elite_four"]
    assert [opponent["opponent_name"] for opponent in elite_four_breakdown] == [
        "Lorelei",
        "Bruno",
        "Agatha",
        "Lance",
    ]
    assert all("matchup_score" in opponent for opponent in elite_four_breakdown)
    assert all("explanation" in opponent for opponent in elite_four_breakdown)


def test_scoring_includes_champion_breakdown() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    champion_breakdown = response.json()["opponent_breakdown"]["champion"]
    assert len(champion_breakdown) == 1
    assert champion_breakdown[0]["opponent_name"] == "Gary"
    assert champion_breakdown[0]["stage"] == "Champion"
    assert champion_breakdown[0]["matchup_score"] > 0
    assert champion_breakdown[0]["explanation"]


def test_strong_balanced_team_receives_high_score() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_BALANCED_TEAM},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] >= 95
    assert data["result"] == "Win - Undefeated Champion"


def test_weak_unbalanced_team_receives_low_score() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": WEAK_UNBALANCED_TEAM},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] < 75
    assert len(data["badges_earned"]) < 8
    assert data["elite_four_unlocked"] is False
    assert data["result"] == "Lose - Did not beat all Gym Leaders"


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
        json={
            "pokemon_names": [
                "Charizard",
                "Lapras",
                "Jolteon",
            ]
        },
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


def test_gym_leader_normal_win_still_works(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 48)

    breakdown = team_scoring._score_opponent(
        _fake_team(430),
        _fake_opponent("Brock", badge_name="Boulder Badge"),
        team_scoring.GYM_WIN_THRESHOLD,
        allow_lucky_win=True,
        random_number_generator=lambda: 0.99,
    )

    assert breakdown["outcome"] == "Beat"
    assert breakdown["win_type"] == "normal"
    assert breakdown["lucky_win"] is False
    assert breakdown["badge_earned"] is True


def test_gym_leader_normal_loss_still_works(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 41)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Misty", badge_name="Cascade Badge"),
        team_scoring.GYM_WIN_THRESHOLD,
        allow_lucky_win=True,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["win_type"] == "loss"
    assert breakdown["lucky_win"] is False
    assert breakdown["badge_earned"] is False


def test_gym_leader_lucky_win_can_happen_for_close_strong_matchup(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Lt. Surge", badge_name="Thunder Badge"),
        team_scoring.GYM_WIN_THRESHOLD,
        allow_lucky_win=True,
        random_number_generator=lambda: 0.1,
    )

    assert breakdown["outcome"] == "Beat"
    assert breakdown["win_type"] == "lucky"
    assert breakdown["lucky_win"] is True
    assert breakdown["lucky_win_chance"] == 0.5
    assert breakdown["random_roll"] == 0.1
    assert breakdown["badge_earned"] is True
    assert "scraped through" in breakdown["explanation"]


def test_gym_leaders_are_processed_sequentially(monkeypatch) -> None:
    matchup_scores = {
        "Brock": 48,
        "Misty": 41,
        "Lt. Surge": 99,
        "Erika": 99,
        "Koga": 99,
        "Sabrina": 99,
        "Blaine": 99,
        "Giovanni": 99,
    }
    monkeypatch.setattr(
        team_scoring,
        "_calculate_matchup_score",
        lambda _team, opponent: matchup_scores.get(opponent["name"], 0),
    )

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0,
    )
    gym_breakdown = data["opponent_breakdown"]["gym_leaders"]

    assert data["badges_earned"] == ["Boulder Badge"]
    assert gym_breakdown[0]["win_type"] == "normal"
    assert gym_breakdown[1]["win_type"] == "loss"
    assert [opponent["win_type"] for opponent in gym_breakdown[2:]] == [
        "locked",
        "locked",
        "locked",
        "locked",
        "locked",
        "locked",
    ]
    assert all(
        "not reached" in opponent["explanation"]
        for opponent in gym_breakdown[2:]
    )


def test_losing_to_first_gym_leader_locks_later_gym_leaders(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 41)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0,
    )
    gym_breakdown = data["opponent_breakdown"]["gym_leaders"]

    assert data["badges_earned"] == []
    assert gym_breakdown[0]["opponent_name"] == "Brock"
    assert gym_breakdown[0]["win_type"] == "loss"
    assert all(opponent["win_type"] == "locked" for opponent in gym_breakdown[1:])
    assert all(opponent["badge_earned"] is False for opponent in gym_breakdown)
    assert data["elite_four_unlocked"] is False


def test_gym_leader_lucky_win_cannot_happen_far_below_threshold(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 41)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Erika", badge_name="Rainbow Badge"),
        team_scoring.GYM_WIN_THRESHOLD,
        allow_lucky_win=True,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["lucky_win"] is False
    assert breakdown["lucky_win_chance"] == 0
    assert breakdown["random_roll"] is None


def test_gym_leader_lucky_win_cannot_happen_with_weak_base_stats(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    breakdown = team_scoring._score_opponent(
        _fake_team(419),
        _fake_opponent("Koga", badge_name="Soul Badge"),
        team_scoring.GYM_WIN_THRESHOLD,
        allow_lucky_win=True,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["lucky_win"] is False
    assert breakdown["lucky_win_chance"] == 0
    assert breakdown["random_roll"] is None


def test_elite_four_never_receives_lucky_win(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Lorelei", stage="Elite Four 1"),
        team_scoring.ELITE_FOUR_WIN_THRESHOLD,
        allow_lucky_win=False,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["win_type"] == "loss"
    assert breakdown["lucky_win"] is False
    assert breakdown["lucky_win_chance"] == 0
    assert breakdown["random_roll"] is None


def test_champion_gary_never_receives_lucky_win(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Gary", stage="Champion"),
        team_scoring.CHAMPION_WIN_THRESHOLD,
        allow_lucky_win=False,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["win_type"] == "loss"
    assert breakdown["lucky_win"] is False


def test_champion_gary_cannot_be_beaten_through_lucky_progression(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 69)

    breakdown = team_scoring._score_opponent(
        _fake_team(520),
        _fake_opponent("Gary", stage="Champion"),
        team_scoring.CHAMPION_WIN_THRESHOLD,
        allow_lucky_win=False,
        random_number_generator=lambda: 0,
    )

    assert breakdown["outcome"] == "Lost"
    assert breakdown["win_type"] == "loss"
    assert breakdown["lucky_win"] is False


def test_failed_lucky_roll_counts_as_loss_and_stops_progression(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0.99,
    )
    gym_breakdown = data["opponent_breakdown"]["gym_leaders"]

    assert data["badges_earned"] == []
    assert data["elite_four_unlocked"] is False
    assert gym_breakdown[0]["outcome"] == "Lost"
    assert gym_breakdown[0]["win_type"] == "loss"
    assert gym_breakdown[0]["lucky_win"] is False
    assert gym_breakdown[0]["lucky_win_chance"] == 0.5
    assert gym_breakdown[0]["random_roll"] == 0.99
    assert all(opponent["win_type"] == "locked" for opponent in gym_breakdown[1:])


def test_lucky_gym_badges_can_unlock_elite_four(monkeypatch) -> None:
    monkeypatch.setattr(team_scoring, "_calculate_matchup_score", lambda *_: 44)

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0,
    )

    assert len(data["badges_earned"]) == 8
    assert data["elite_four_unlocked"] is True
    assert all(
        opponent["win_type"] == "lucky"
        for opponent in data["opponent_breakdown"]["gym_leaders"]
    )
    assert all(
        opponent["lucky_win"] is False
        for opponent in data["opponent_breakdown"]["elite_four"]
    )
    assert all(
        opponent["lucky_win"] is False
        for opponent in data["opponent_breakdown"]["champion"]
    )


def test_elite_four_and_champion_have_no_lucky_progression_in_full_run(
    monkeypatch,
) -> None:
    matchup_scores = {
        "Brock": 48,
        "Misty": 48,
        "Lt. Surge": 48,
        "Erika": 48,
        "Koga": 48,
        "Sabrina": 48,
        "Blaine": 48,
        "Giovanni": 48,
        "Lorelei": 61,
        "Bruno": 61,
        "Agatha": 61,
        "Lance": 61,
        "Gary": 69,
    }
    monkeypatch.setattr(
        team_scoring,
        "_calculate_matchup_score",
        lambda _team, opponent: matchup_scores[opponent["name"]],
    )

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0,
    )

    assert len(data["badges_earned"]) == 8
    assert data["elite_four_unlocked"] is True
    assert all(
        opponent["win_type"] == "loss"
        and opponent["lucky_win"] is False
        and opponent["random_roll"] is None
        for opponent in data["opponent_breakdown"]["elite_four"]
    )
    assert all(
        opponent["win_type"] == "locked"
        and opponent["lucky_win"] is False
        and opponent["random_roll"] is None
        for opponent in data["opponent_breakdown"]["champion"]
    )


def test_champion_gary_has_no_lucky_progression_after_elite_four(monkeypatch) -> None:
    matchup_scores = {
        "Brock": 48,
        "Misty": 48,
        "Lt. Surge": 48,
        "Erika": 48,
        "Koga": 48,
        "Sabrina": 48,
        "Blaine": 48,
        "Giovanni": 48,
        "Lorelei": 62,
        "Bruno": 62,
        "Agatha": 62,
        "Lance": 62,
        "Gary": 69,
    }
    monkeypatch.setattr(
        team_scoring,
        "_calculate_matchup_score",
        lambda _team, opponent: matchup_scores[opponent["name"]],
    )

    data = team_scoring.score_team(
        STRONG_BALANCED_TEAM,
        random_number_generator=lambda: 0,
    )
    champion = data["opponent_breakdown"]["champion"][0]

    assert data["elite_four_unlocked"] is True
    assert champion["outcome"] == "Lost"
    assert champion["win_type"] == "loss"
    assert champion["lucky_win"] is False
    assert champion["lucky_win_chance"] == 0
    assert champion["random_roll"] is None


def _fake_team(base_stat_total: int) -> list[dict]:
    return [
        {
            "name": f"Pokemon {index}",
            "primary_type": "Normal",
            "secondary_type": None,
            "base_stat_total": base_stat_total,
        }
        for index in range(team_scoring.TEAM_SIZE)
    ]


def _fake_opponent(
    name: str,
    stage: str = "Gym Leader 1",
    badge_name: Optional[str] = None,
) -> dict:
    opponent = {
        "name": name,
        "stage": stage,
        "specialty_types": ["Rock"],
        "recommended_counter_types": ["Water"],
    }
    if badge_name:
        opponent["badge_name"] = badge_name
    return opponent
