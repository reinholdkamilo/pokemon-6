#!/usr/bin/env python3
"""Download Gen 2 Pokemon data and sprites for the Johto foundation.

Structured stats/types come from PokeAPI. Pixel sprites come from PokemonDB's
Generation 2 sprite archive. The script writes data and assets without changing
the current Gen 1 gameplay endpoints.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import json
import time


POKEAPI_POKEMON_URL = "https://pokeapi.co/api/v2/pokemon/{id}"
POKEMONDB_SPRITE_TEMPLATE = (
    "https://img.pokemondb.net/sprites/{version}/normal/{slug}.png"
)
USER_AGENT = "Mozilla/5.0 (compatible; pokemon-6-johto-foundation/1.0)"
GEN2_RANGE = range(152, 252)
SPRITE_VERSIONS = ("silver", "crystal", "gold")
DATA_PATH = Path("backend/app/data/gen2_pokemon.json")
SPRITE_DIR = Path("frontend/public/images/pokemon-gen2")
MANIFEST_PATH = SPRITE_DIR / "manifest.json"
ATTRIBUTION_PATH = SPRITE_DIR / "ATTRIBUTION.md"
MAX_WORKERS = 10


SLUG_OVERRIDES = {
    "ho-oh": "ho-oh",
    "porygon2": "porygon2",
    "unown": "unown",
    "farfetchd": "farfetchd",
}


def request_json(url: str, attempts: int = 3) -> dict:
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError):
            if attempt == attempts:
                raise
            time.sleep(0.75 * attempt)
    raise RuntimeError(f"Failed to fetch JSON from {url}")


def request_bytes(url: str, attempts: int = 3) -> bytes:
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError):
            if attempt == attempts:
                raise
            time.sleep(0.75 * attempt)
    raise RuntimeError(f"Failed to fetch bytes from {url}")


def display_name(api_name: str) -> str:
    special = {
        "ho-oh": "Ho-Oh",
        "porygon2": "Porygon2",
        "mr-mime": "Mr. Mime",
    }
    if api_name in special:
        return special[api_name]
    return " ".join(part.capitalize() for part in api_name.split("-"))


def sprite_slug(api_name: str) -> str:
    normalized = api_name.replace("'", "").replace(".", "").replace(" ", "-")
    return SLUG_OVERRIDES.get(normalized, normalized)


def png_dimensions(data: bytes) -> tuple[int | None, int | None]:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or len(data) < 24:
        return None, None
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def fetch_pokemon(pokemon_id: int) -> tuple[dict, dict]:
    data = request_json(POKEAPI_POKEMON_URL.format(id=pokemon_id))
    stats = {item["stat"]["name"]: item["base_stat"] for item in data["stats"]}
    types = sorted(data["types"], key=lambda item: item["slot"])
    primary_type = types[0]["type"]["name"].capitalize()
    secondary_type = types[1]["type"]["name"].capitalize() if len(types) > 1 else None
    name = display_name(data["name"])
    slug = sprite_slug(data["name"])

    sprite_source = None
    sprite_data = None

    for version in SPRITE_VERSIONS:
        candidate = POKEMONDB_SPRITE_TEMPLATE.format(version=version, slug=slug)
        try:
            candidate_data = request_bytes(candidate, attempts=2)
        except Exception:
            continue

        if candidate_data[:8] == b"\x89PNG\r\n\x1a\n":
            sprite_source = candidate
            sprite_data = candidate_data
            break

    if sprite_data is None or sprite_source is None:
        raise RuntimeError(f"No PokemonDB Gen 2 sprite found for {pokemon_id} {name}")

    destination = SPRITE_DIR / f"{pokemon_id}.png"
    destination.write_bytes(sprite_data)
    width, height = png_dimensions(sprite_data)

    pokemon = {
        "id": pokemon_id,
        "name": name,
        "generation": 2,
        "primary_type": primary_type,
        "secondary_type": secondary_type,
        "hp": stats["hp"],
        "attack": stats["attack"],
        "defense": stats["defense"],
        "special_attack": stats["special-attack"],
        "special_defense": stats["special-defense"],
        "speed": stats["speed"],
        "base_stat_total": sum(stats.values()),
        "image": f"/images/pokemon-gen2/{pokemon_id}.png",
    }

    manifest = {
        "id": pokemon_id,
        "name": name,
        "slug": slug,
        "path": f"/images/pokemon-gen2/{pokemon_id}.png",
        "spriteSourceUrl": sprite_source,
        "dataSourceUrl": POKEAPI_POKEMON_URL.format(id=pokemon_id),
        "width": width,
        "height": height,
        "bytes": len(sprite_data),
    }

    return pokemon, manifest


def write_attribution(manifest_items: list[dict]) -> None:
    lines = [
        "# Gen 2 Pokemon Sprite Attribution",
        "",
        "Pokemon data source: https://pokeapi.co/",
        "Pokemon sprite source: https://pokemondb.net/sprites#gen2",
        "",
        "Sprites were downloaded from PokemonDB's Generation 2 sprite archive.",
        "",
        f"Sprites downloaded: {len(manifest_items)}",
        "",
        "## Sprite sources",
        "",
    ]

    for item in manifest_items:
        lines.append(
            f"- `{item['id']}.png` {item['name']}: {item['spriteSourceUrl']}"
        )

    lines.append("")
    ATTRIBUTION_PATH.write_text("\n".join(lines))


def main() -> None:
    SPRITE_DIR.mkdir(parents=True, exist_ok=True)
    pokemon_items: list[dict] = []
    manifest_items: list[dict] = []
    failures: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_pokemon, pokemon_id): pokemon_id for pokemon_id in GEN2_RANGE}
        for index, future in enumerate(as_completed(futures), start=1):
            pokemon_id = futures[future]
            try:
                pokemon, manifest = future.result()
            except Exception as error:  # noqa: BLE001 - report all failures.
                failures.append(f"{pokemon_id}: {error}")
            else:
                pokemon_items.append(pokemon)
                manifest_items.append(manifest)

            if index % 20 == 0 or index == len(futures):
                print(f"Processed {index}/{len(futures)}")

    if failures:
        for failure in failures:
            print(f"FAILED: {failure}")
        raise SystemExit(f"{len(failures)} Gen 2 downloads failed.")

    pokemon_items.sort(key=lambda item: item["id"])
    manifest_items.sort(key=lambda item: item["id"])

    DATA_PATH.write_text(json.dumps(pokemon_items, indent=2) + "\n")
    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "source": {
                    "pokemonData": "https://pokeapi.co/",
                    "pokemonSprites": "https://pokemondb.net/sprites#gen2",
                },
                "total": len(manifest_items),
                "sprites": manifest_items,
            },
            indent=2,
        )
        + "\n"
    )
    write_attribution(manifest_items)

    print(f"Wrote {DATA_PATH}")
    print(f"Wrote {MANIFEST_PATH}")
    print(f"Wrote {ATTRIBUTION_PATH}")


if __name__ == "__main__":
    main()
