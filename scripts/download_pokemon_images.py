#!/usr/bin/env python3
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlretrieve


POKEMON_COUNT = 151
REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGE_DIR = REPO_ROOT / "frontend" / "public" / "images" / "pokemon"
URL_TEMPLATE = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png"
)


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    downloaded = 0
    skipped = 0
    failed: list[int] = []

    for pokemon_id in range(1, POKEMON_COUNT + 1):
        destination = IMAGE_DIR / f"{pokemon_id}.png"

        if destination.exists():
            skipped += 1
            continue

        try:
            urlretrieve(URL_TEMPLATE.format(id=pokemon_id), destination)
            downloaded += 1
        except (HTTPError, URLError, OSError) as error:
            failed.append(pokemon_id)
            print(f"Failed {pokemon_id}: {error}")

    print(
        f"Pokemon sprites: downloaded {downloaded}, skipped {skipped}, failed {len(failed)}."
    )
    if failed:
        print("Failed ids: " + ", ".join(str(pokemon_id) for pokemon_id in failed))


if __name__ == "__main__":
    main()
