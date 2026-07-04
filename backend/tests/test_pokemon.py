from fastapi.testclient import TestClient

from app.main import app
from app.services.pokemon_service import get_all_pokemon


client = TestClient(app)

REQUIRED_FIELDS = {
    "id",
    "name",
    "generation",
    "primary_type",
    "secondary_type",
    "hp",
    "attack",
    "defense",
    "special_attack",
    "special_defense",
    "speed",
    "base_stat_total",
    "image",
}
STAT_FIELDS = {
    "hp",
    "attack",
    "defense",
    "special_attack",
    "special_defense",
    "speed",
}


def test_all_151_gen1_pokemon_are_loaded() -> None:
    pokemon = get_all_pokemon()

    assert len(pokemon) == 151
    assert pokemon[0]["id"] == 1
    assert pokemon[0]["name"] == "Bulbasaur"
    assert pokemon[-1]["id"] == 151
    assert pokemon[-1]["name"] == "Mew"
    assert all(entry["generation"] == 1 for entry in pokemon)


def test_pokemon_ids_and_names_are_unique() -> None:
    pokemon = get_all_pokemon()

    assert len({entry["id"] for entry in pokemon}) == 151
    assert len({entry["name"] for entry in pokemon}) == 151


def test_each_pokemon_has_required_fields() -> None:
    for pokemon in get_all_pokemon():
        assert set(pokemon) == REQUIRED_FIELDS
        assert isinstance(pokemon["id"], int)
        assert isinstance(pokemon["name"], str)
        assert isinstance(pokemon["primary_type"], str)
        assert pokemon["secondary_type"] is None or isinstance(
            pokemon["secondary_type"],
            str,
        )
        assert all(isinstance(pokemon[field], int) for field in STAT_FIELDS)
        assert pokemon["base_stat_total"] == sum(
            pokemon[field] for field in STAT_FIELDS
        )
        assert pokemon["image"] == f"/images/pokemon/{pokemon['id']}.png"


def test_pokemon_endpoint_returns_151_pokemon() -> None:
    response = client.get("/pokemon")

    assert response.status_code == 200
    assert len(response.json()) == 151


def test_pokemon_search_matches_char_mew_and_saur() -> None:
    search_expectations = {
        "char": {"Charmander", "Charmeleon", "Charizard"},
        "mew": {"Mew", "Mewtwo"},
        "saur": {"Bulbasaur", "Ivysaur", "Venusaur"},
    }

    for query, expected_names in search_expectations.items():
        response = client.get("/pokemon/search", params={"query": query})

        assert response.status_code == 200
        result_names = {pokemon["name"] for pokemon in response.json()}
        assert expected_names.issubset(result_names)
