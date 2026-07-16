from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


DEFAULT_TARGETS = (
    "frontend/public/images/pokemon-gen2",
    "frontend/public/images/trainers/showdown/raw",
)


def is_near_white(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return alpha > 245 and red >= 245 and green >= 245 and blue >= 245


def is_opaque(pixel: tuple[int, int, int, int]) -> bool:
    return pixel[3] > 245


def edge_pixels(pixels: list[tuple[int, int, int, int]], width: int, height: int):
    for x in range(width):
        yield pixels[x]
        yield pixels[(height - 1) * width + x]
    for y in range(1, height - 1):
        yield pixels[y * width]
        yield pixels[y * width + width - 1]


def scan_png(path: Path) -> dict[str, float | str]:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        width, height = rgba.size
        pixels = list(rgba.getdata())

    edges = list(edge_pixels(pixels, width, height))
    corners = [
        pixels[0],
        pixels[width - 1],
        pixels[(height - 1) * width],
        pixels[(height - 1) * width + width - 1],
    ]
    opaque_edges = [pixel for pixel in edges if is_opaque(pixel)]
    white_edges = [pixel for pixel in edges if is_near_white(pixel)]
    white_corners = [pixel for pixel in corners if is_near_white(pixel)]

    return {
        "path": str(path),
        "size": f"{width}x{height}",
        "opaque_edge_ratio": len(opaque_edges) / max(1, len(edges)),
        "white_edge_ratio": len(white_edges) / max(1, len(edges)),
        "white_corner_count": len(white_corners),
    }


def remove_connected_white_background(path: Path) -> bool:
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        width, height = rgba.size
        pixels = list(rgba.getdata())

    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        index = y * width + x
        if not is_near_white(pixels[index]):
            continue

        red, green, blue, _alpha = pixels[index]
        pixels[index] = (red, green, blue, 0)

        if x > 0:
            queue.append((x - 1, y))
        if x < width - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < height - 1:
            queue.append((x, y + 1))

    if all(pixel[3] > 0 for pixel in pixels):
        return False

    cleaned = Image.new("RGBA", (width, height))
    cleaned.putdata(pixels)
    cleaned.save(path, optimize=True)
    return True


def is_suspicious(result: dict[str, float | str]) -> bool:
    return (
        result["white_corner_count"] >= 2
        or result["white_edge_ratio"] >= 0.18
        or (
            result["opaque_edge_ratio"] >= 0.92
            and result["white_edge_ratio"] >= 0.08
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scan sprite PNGs for likely opaque white backgrounds.",
    )
    parser.add_argument("paths", nargs="*", default=DEFAULT_TARGETS)
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Remove connected near-white backgrounds from suspicious sprites.",
    )
    args = parser.parse_args()

    root = Path.cwd()
    pngs: list[Path] = []
    for target in args.paths:
        target_path = (root / target).resolve()
        if target_path.is_file() and target_path.suffix.lower() == ".png":
            pngs.append(target_path)
        elif target_path.is_dir():
            pngs.extend(sorted(target_path.rglob("*.png")))

    if not pngs:
        print("No PNG sprites found to scan.")
        return 1

    suspicious = []
    fixed = 0
    for png in pngs:
        result = scan_png(png)
        if is_suspicious(result):
            suspicious.append(result)
            if args.fix and remove_connected_white_background(png):
                fixed += 1

    if args.fix and fixed:
        suspicious = []
        for png in pngs:
            result = scan_png(png)
            if is_suspicious(result):
                suspicious.append(result)

    print(f"Scanned {len(pngs)} PNG sprites.")
    print(f"Likely white-background sprites: {len(suspicious)}")
    if args.fix:
        print(f"Sprites cleaned: {fixed}")

    for result in suspicious[:50]:
        path = Path(str(result["path"])).relative_to(root)
        print(
            f"WARNING {path} size={result['size']} "
            f"white_edges={result['white_edge_ratio']:.2%} "
            f"opaque_edges={result['opaque_edge_ratio']:.2%} "
            f"white_corners={result['white_corner_count']}"
        )

    if len(suspicious) > 50:
        print(f"...and {len(suspicious) - 50} more.")

    return 1 if suspicious else 0


if __name__ == "__main__":
    raise SystemExit(main())
