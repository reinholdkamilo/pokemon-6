import json

from fastapi.testclient import TestClient

from app.main import app
from app.routes import trainers


client = TestClient(app)


def test_save_valid_trainer(tmp_path, monkeypatch) -> None:
    trainer_file = tmp_path / "pokemon_trainers.json"
    monkeypatch.setattr(trainers, "DATA_DIR", tmp_path)
    monkeypatch.setattr(trainers, "TRAINERS_PATH", trainer_file)

    response = client.post("/trainers", json=_trainer_payload())

    assert response.status_code == 200
    data = response.json()
    assert data["id"]
    assert data["name"] == "Leaf"
    assert data["email"] == "leaf@example.test"
    assert json.loads(trainer_file.read_text(encoding="utf-8")) == [data]


def test_reject_missing_trainer_name(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(trainers, "DATA_DIR", tmp_path)
    monkeypatch.setattr(trainers, "TRAINERS_PATH", tmp_path / "pokemon_trainers.json")

    payload = _trainer_payload()
    payload["name"] = ""

    response = client.post("/trainers", json=payload)

    assert response.status_code == 422


def test_reject_invalid_trainer_email(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(trainers, "DATA_DIR", tmp_path)
    monkeypatch.setattr(trainers, "TRAINERS_PATH", tmp_path / "pokemon_trainers.json")

    payload = _trainer_payload()
    payload["email"] = "leaf.example.test"

    response = client.post("/trainers", json=payload)

    assert response.status_code == 422


def test_create_trainer_file_if_missing(tmp_path, monkeypatch) -> None:
    trainer_file = tmp_path / "pokemon_trainers.json"
    monkeypatch.setattr(trainers, "DATA_DIR", tmp_path)
    monkeypatch.setattr(trainers, "TRAINERS_PATH", trainer_file)

    assert not trainer_file.exists()

    response = client.post("/trainers", json=_trainer_payload())

    assert response.status_code == 200
    assert trainer_file.exists()


def test_trainer_preflight_allows_local_network_frontend() -> None:
    response = client.options(
        "/trainers",
        headers={
            "Origin": "http://192.168.1.126:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://192.168.1.126:3000"
    )
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()


def _trainer_payload() -> dict:
    return {
        "name": "Leaf",
        "dob": "1998-09-28",
        "email": "leaf@example.test",
        "hometown": "Pallet Town",
        "sprite": "player-female",
        "created_at": "2026-07-05T00:00:00.000Z",
    }
