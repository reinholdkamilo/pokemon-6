import json
from functools import lru_cache
from pathlib import Path


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "gen1_pokemon.json"


@lru_cache
def get_all_pokemon() -> list[dict]:
    with DATA_PATH.open("r", encoding="utf-8") as pokemon_file:
        return json.load(pokemon_file)


def search_pokemon(query: str) -> list[dict]:
    normalized_query = query.strip().lower()

    if not normalized_query:
        return []

    return [
        pokemon
        for pokemon in get_all_pokemon()
        if normalized_query in pokemon["name"].lower()
    ]
