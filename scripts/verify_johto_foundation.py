#!/usr/bin/env python3
"""Verify the Johto foundation data and assets are internally consistent."""

from __future__ import annotations

from pathlib import Path

import json
import re


ROOT = Path(__file__).resolve().parents[1]
GEN2_DATA = ROOT / "backend/app/data/gen2_pokemon.json"
GEN2_SPRITES = ROOT / "frontend/public/images/pokemon-gen2"
JOHTO_REGION = ROOT / "frontend/lib/johtoRegion.ts"
SHOWDOWN_RAW = ROOT / "frontend/public/images/trainers/showdown/raw"


def assert_png(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise AssertionError(f"{path} is not a PNG")
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def main() -> None:
    pokemon = json.loads(GEN2_DATA.read_text())

    if len(pokemon) != 100:
        raise AssertionError(f"Expected 100 Gen 2 Pokemon, found {len(pokemon)}")

    ids = [item["id"] for item in pokemon]
    if ids != list(range(152, 252)):
        raise AssertionError("Gen 2 Pokemon IDs must be exactly 152 through 251")

    for item in pokemon:
        expected_image = f"/images/pokemon-gen2/{item['id']}.png"
        if item["image"] != expected_image:
            raise AssertionError(f"{item['name']} has unexpected image {item['image']}")

        width, height = assert_png(GEN2_SPRITES / f"{item['id']}.png")
        if width <= 0 or height <= 0:
            raise AssertionError(f"{item['id']} has invalid sprite dimensions")

    region_source = JOHTO_REGION.read_text()
    direct_paths = set(re.findall(r"/images/trainers/showdown/raw/[^`\"']+\\.png", region_source))
    template_paths = {
        f"/images/trainers/showdown/raw/{filename}"
        for filename in re.findall(r"\$\{SHOWDOWN_TRAINER_BASE\}/([^`\"']+\.png)", region_source)
    }
    trainer_paths = sorted(direct_paths | template_paths)

    if not trainer_paths:
        raise AssertionError("No Johto trainer sprite paths were found")

    for trainer_path in trainer_paths:
        local_path = ROOT / "frontend/public" / trainer_path.lstrip("/")
        if not local_path.exists():
            raise AssertionError(f"Missing trainer sprite: {trainer_path}")
        assert_png(local_path)

    for stage_number in range(1, 9):
        if f"number: {stage_number}," not in region_source:
            raise AssertionError(f"Missing Johto stage {stage_number}")

    for badge in [
        "Zephyr Badge",
        "Hive Badge",
        "Plain Badge",
        "Fog Badge",
        "Storm Badge",
        "Mineral Badge",
        "Glacier Badge",
        "Rising Badge",
    ]:
        if badge not in region_source:
            raise AssertionError(f"Missing Johto badge: {badge}")

    for leader in [
        "Falkner",
        "Bugsy",
        "Whitney",
        "Morty",
        "Chuck",
        "Jasmine",
        "Pryce",
        "Clair",
        "Will",
        "Koga",
        "Bruno",
        "Karen",
        "Lance",
    ]:
        if leader not in region_source:
            raise AssertionError(f"Missing Johto trainer: {leader}")

    print(f"Verified {len(pokemon)} Gen 2 Pokemon")
    print(f"Verified {len(trainer_paths)} Johto trainer sprite paths")


if __name__ == "__main__":
    main()
