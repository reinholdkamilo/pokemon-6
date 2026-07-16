#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


POKEMON_COUNT = 151
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "backend" / "app" / "data" / "gen1_pokemon.json"
NORMAL_DIR = REPO_ROOT / "frontend" / "public" / "images" / "pokemon"
SHINY_DIR = REPO_ROOT / "frontend" / "public" / "images" / "pokemon-shiny"
USER_AGENT = "Mozilla/5.0 (Pokemon 6 asset refresh; contact: local development)"


@dataclass(frozen=True)
class PokemonEntry:
    id: int
    name: str
    page_slug: str


def main() -> None:
    pokemon = load_gen1_pokemon()
    NORMAL_DIR.mkdir(parents=True, exist_ok=True)
    SHINY_DIR.mkdir(parents=True, exist_ok=True)

    normal_manifest: list[dict[str, str | int]] = []
    shiny_manifest: list[dict[str, str | int]] = []
    failures: list[str] = []

    for entry in pokemon:
        try:
            page_html = fetch_text(f"https://pokemondb.net/sprites/{entry.page_slug}")
            normal_url = find_normal_sprite_url(page_html, entry.page_slug)
            shiny_url = find_shiny_sprite_url(page_html, entry.page_slug)

            normal_path = NORMAL_DIR / f"{entry.id}.png"
            shiny_path = SHINY_DIR / f"{entry.id}.png"

            download_binary(normal_url, normal_path)
            download_binary(shiny_url, shiny_path)

            normal_manifest.append(
                {
                    "id": entry.id,
                    "name": entry.name,
                    "source": normal_url,
                    "file": f"{entry.id}.png",
                }
            )
            shiny_manifest.append(
                {
                    "id": entry.id,
                    "name": entry.name,
                    "source": shiny_url,
                    "file": f"{entry.id}.png",
                }
            )
            print(f"{entry.id:03d} {entry.name}: normal + shiny")
            time.sleep(0.04)
        except Exception as error:
            failures.append(f"{entry.id:03d} {entry.name}: {error}")

    write_manifest(NORMAL_DIR, normal_manifest, "Gen 1 normal sprites")
    write_manifest(SHINY_DIR, shiny_manifest, "Gen 1 shiny sprites")

    print()
    print(f"Downloaded normal sprites: {len(normal_manifest)}")
    print(f"Downloaded shiny sprites:  {len(shiny_manifest)}")

    if failures:
      print("Failures:")
      for failure in failures:
          print(f"  - {failure}")
      raise SystemExit(1)


def load_gen1_pokemon() -> list[PokemonEntry]:
    raw_entries = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    entries = [
        PokemonEntry(
            id=int(raw_entry["id"]),
            name=str(raw_entry["name"]),
            page_slug=slugify_pokemondb_name(str(raw_entry["name"])),
        )
        for raw_entry in raw_entries
        if 1 <= int(raw_entry["id"]) <= POKEMON_COUNT
    ]
    return sorted(entries, key=lambda entry: entry.id)


def slugify_pokemondb_name(name: str) -> str:
    overrides = {
        "Nidoran F": "nidoran-f",
        "Nidoran M": "nidoran-m",
        "Farfetch'd": "farfetchd",
        "Mr. Mime": "mr-mime",
    }
    if name in overrides:
        return overrides[name]
    return (
        name.lower()
        .replace("'", "")
        .replace(".", "")
        .replace(" ", "-")
    )


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def download_binary(url: str, path: Path) -> None:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        payload = response.read()

    if not payload.startswith(b"\x89PNG"):
        raise ValueError(f"Expected PNG from {url}")

    path.write_bytes(payload)


def find_normal_sprite_url(page_html: str, slug: str) -> str:
    candidates = extract_sprite_urls(page_html)
    preferences = [
        f"/sprites/red-blue/normal/{slug}-color.png",
        f"/sprites/yellow/normal/{slug}-color.png",
        f"/sprites/red-blue/normal/{slug}.png",
        f"/sprites/home/normal/{slug}.png",
        f"/sprites/home/normal/1x/{slug}.png",
    ]
    return pick_preferred_url(candidates, preferences, "normal", slug)


def find_shiny_sprite_url(page_html: str, slug: str) -> str:
    candidates = extract_sprite_urls(page_html)
    preferences = [
        f"/sprites/silver/shiny/{slug}.png",
        f"/sprites/crystal/shiny/{slug}.png",
        f"/sprites/home/shiny/1x/{slug}.png",
        f"/sprites/home/shiny/{slug}.png",
    ]
    return pick_preferred_url(candidates, preferences, "shiny", slug)


def extract_sprite_urls(page_html: str) -> list[str]:
    return sorted(
        set(
            re.findall(
                r"https://img\.pokemondb\.net/sprites/[^\"']+\.png",
                page_html,
            )
        )
    )


def pick_preferred_url(
    candidates: list[str],
    preferences: list[str],
    label: str,
    slug: str,
) -> str:
    for preference in preferences:
        for candidate in candidates:
            if candidate.endswith(preference):
                return candidate

    raise ValueError(f"No {label} sprite URL found for {slug}")


def write_manifest(
    output_dir: Path,
    entries: list[dict[str, str | int]],
    title: str,
) -> None:
    (output_dir / "manifest.json").write_text(
        json.dumps(entries, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "ATTRIBUTION.md").write_text(
        "\n".join(
            [
                f"# {title}",
                "",
                "Sprites refreshed from PokemonDB sprite pages.",
                "",
                "- Normal Gen 1 source: https://pokemondb.net/sprites#gen1",
                "- Shiny Gen 1 source: https://pokemondb.net/pokedex/shiny#gen-1",
                "",
                "Pokemon assets are fan/reference assets and remain subject to their original rights holders.",
                "",
            ]
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
