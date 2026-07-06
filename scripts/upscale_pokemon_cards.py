from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "frontend" / "public" / "images" / "pokemon-cards"
OUTPUT_DIR = ROOT / "frontend" / "public" / "images" / "pokemon-cards-hd"

UPSCALE_FACTOR = 3

def main():
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source folder not found: {SOURCE_DIR}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    png_files = sorted(SOURCE_DIR.glob("*.png"))
    if not png_files:
        raise FileNotFoundError(f"No PNG files found in: {SOURCE_DIR}")

    processed = 0

    for src in png_files:
        with Image.open(src) as img:
            img = img.convert("RGBA")

            new_size = (
                img.width * UPSCALE_FACTOR,
                img.height * UPSCALE_FACTOR,
            )

            upscaled = img.resize(new_size, Image.Resampling.LANCZOS)

            sharpened = upscaled.filter(
                ImageFilter.UnsharpMask(
                    radius=1.2,
                    percent=135,
                    threshold=3,
                )
            )

            output_path = OUTPUT_DIR / src.name
            sharpened.save(output_path, "PNG", optimize=True)
            processed += 1

    print(f"Upscaled {processed} PNG files")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Upscale factor: {UPSCALE_FACTOR}x")
    print("Sharpening: UnsharpMask radius=1.2 percent=135 threshold=3")

if __name__ == "__main__":
    main()
