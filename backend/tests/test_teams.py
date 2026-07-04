from fastapi.testclient import TestClient

from app.main import app


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


def test_elite_four_unlocked_false_when_fewer_than_8_badges() -> None:
    response = client.post(
        "/teams/score",
        json={"pokemon_names": STRONG_TEAM_WITHOUT_ALL_BADGES},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["badges_earned"]) < 8
    assert data["elite_four_unlocked"] is False
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
