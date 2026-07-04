from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_score_valid_six_pokemon_team() -> None:
    response = client.post(
        "/teams/score",
        json={
            "pokemon_names": [
                "Charizard",
                "Lapras",
                "Raichu",
                "Alakazam",
                "Snorlax",
                "Dragonite",
            ]
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] > 0
    assert data["result"]
    assert len(data["selected_pokemon"]) == 6
    assert set(data["score_breakdown"]) == {
        "base_stat_strength",
        "type_balance",
        "elite_four_coverage",
        "weakness_management",
        "team_variety",
    }
    assert data["explanation"]
    assert isinstance(data["warnings"], list)


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
