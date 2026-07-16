#!/usr/bin/env python3
"""Download Pokemon Showdown trainer sprites with source attribution.

The Showdown trainer sprite directory includes game and fan-made sprites. This
script keeps the images unedited and records visible artist credit from the
directory index so game code can curate subsets later without losing source
metadata.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

import json
import re
import time


SOURCE_URL = "https://play.pokemonshowdown.com/sprites/trainers/"
OUTPUT_DIR = Path("frontend/public/images/trainers/showdown")
RAW_DIR = OUTPUT_DIR / "raw"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"
ATTRIBUTION_PATH = OUTPUT_DIR / "ATTRIBUTION.md"
USER_AGENT = "Mozilla/5.0 (compatible; pokemon-6-trainer-sprite-ingest/1.0)"
MAX_WORKERS = 12


@dataclass(frozen=True)
class SpriteEntry:
    sprite_id: str
    filename: str
    source_url: str
    artist: str | None
    generation_hint: str | None


class TrainerIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.entries: list[SpriteEntry] = []
        self._current_filename: str | None = None
        self._current_caption: list[str] = []
        self._in_caption = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)

        if tag == "figure":
            figure_id = attrs_dict.get("id")
            if figure_id and figure_id.endswith(".png"):
                self._current_filename = figure_id
                self._current_caption = []

        if tag == "figcaption" and self._current_filename:
            self._in_caption = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "figcaption" and self._current_filename:
            caption = normalize_space(" ".join(self._current_caption))
            artist = extract_artist(caption)
            filename = self._current_filename
            sprite_id = filename.removesuffix(".png")
            self.entries.append(
                SpriteEntry(
                    sprite_id=sprite_id,
                    filename=filename,
                    source_url=urljoin(SOURCE_URL, filename),
                    artist=artist,
                    generation_hint=extract_generation_hint(sprite_id),
                )
            )
            self._in_caption = False

        if tag == "figure":
            self._current_filename = None
            self._current_caption = []
            self._in_caption = False

    def handle_data(self, data: str) -> None:
        if self._in_caption:
            self._current_caption.append(data)


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def extract_artist(caption: str) -> str | None:
    match = re.search(r"\bby\s+(.+)$", caption)
    if not match:
        return None
    artist = normalize_space(match.group(1))
    return artist or None


def extract_generation_hint(sprite_id: str) -> str | None:
    match = re.search(r"(?:^|-)(gen[1-9])(?:$|-)", sprite_id)
    return match.group(1) if match else None


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def download_bytes(url: str, attempts: int = 3) -> bytes:
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=30) as response:
                return response.read()
        except (HTTPError, URLError, TimeoutError):
            if attempt == attempts:
                raise
            time.sleep(0.75 * attempt)
    raise RuntimeError(f"Failed to download {url}")


def png_dimensions(data: bytes) -> tuple[int | None, int | None]:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or len(data) < 24:
        return None, None
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    return width, height


def download_entry(entry: SpriteEntry) -> dict[str, object]:
    destination = RAW_DIR / entry.filename
    data = download_bytes(entry.source_url)

    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{entry.source_url} did not return a PNG")

    destination.write_bytes(data)
    width, height = png_dimensions(data)

    return {
        "id": entry.sprite_id,
        "filename": entry.filename,
        "path": f"/images/trainers/showdown/raw/{entry.filename}",
        "sourceUrl": entry.source_url,
        "artist": entry.artist,
        "generationHint": entry.generation_hint,
        "width": width,
        "height": height,
        "bytes": len(data),
    }


def parse_entries(html: str) -> list[SpriteEntry]:
    parser = TrainerIndexParser()
    parser.feed(html)
    unique: dict[str, SpriteEntry] = {}
    for entry in parser.entries:
        unique[entry.filename] = entry
    return [unique[key] for key in sorted(unique)]


def generation_counts(items: Iterable[dict[str, object]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        hint = item.get("generationHint") or "unclassified"
        counts[str(hint)] = counts.get(str(hint), 0) + 1
    return dict(sorted(counts.items()))


def write_manifest(items: list[dict[str, object]]) -> None:
    payload = {
        "source": {
            "name": "Pokemon Showdown trainer sprites",
            "url": SOURCE_URL,
            "note": (
                "Sprites are downloaded unedited from Pokemon Showdown. "
                "Some sprites are fan-made; preserve artist credit where shown."
            ),
        },
        "total": len(items),
        "generationCounts": generation_counts(items),
        "sprites": items,
    }
    MANIFEST_PATH.write_text(json.dumps(payload, indent=2) + "\n")


def write_attribution(items: list[dict[str, object]]) -> None:
    credited = [item for item in items if item.get("artist")]
    lines = [
        "# Pokemon Showdown Trainer Sprite Attribution",
        "",
        f"Source: {SOURCE_URL}",
        "",
        (
            "Pokemon Showdown notes that many trainer sprites are not from the "
            "games and that appropriate artist credit must be given if used."
        ),
        "",
        f"Sprites downloaded: {len(items)}",
        f"Sprites with visible artist credit: {len(credited)}",
        "",
        "## Credits from the source index",
        "",
    ]

    for item in credited:
        lines.append(
            f"- `{item['filename']}`: {item['artist']} "
            f"({item['sourceUrl']})"
        )

    lines.append("")
    ATTRIBUTION_PATH.write_text("\n".join(lines))


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    html = fetch_text(SOURCE_URL)
    entries = parse_entries(html)

    if not entries:
        raise SystemExit("No trainer sprite PNG entries were found.")

    print(f"Found {len(entries)} trainer sprites.")

    items: list[dict[str, object]] = []
    failures: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {executor.submit(download_entry, entry): entry for entry in entries}
        for index, future in enumerate(as_completed(future_map), start=1):
            entry = future_map[future]
            try:
                items.append(future.result())
            except Exception as error:  # noqa: BLE001 - report all download failures.
                failures.append(f"{entry.filename}: {error}")

            if index % 100 == 0 or index == len(entries):
                print(f"Downloaded {index}/{len(entries)}")

    if failures:
        for failure in failures:
            print(f"FAILED: {failure}")
        raise SystemExit(f"{len(failures)} downloads failed.")

    items.sort(key=lambda item: str(item["filename"]))
    write_manifest(items)
    write_attribution(items)

    print(f"Wrote {MANIFEST_PATH}")
    print(f"Wrote {ATTRIBUTION_PATH}")


if __name__ == "__main__":
    main()
