from PIL import Image
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def png_to_compact(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    data = []
    opaque_count = 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 0:
                opaque_count += 1
                data.extend([r, g, b])

    if opaque_count != width * height:
        raise ValueError(
            f"Imagem com transparência parcial ({opaque_count}/{width * height} pixels); "
            "use o formato x,y,r,g,b manualmente."
        )

    payload = {"width": width, "height": height, "data": data}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Salvo: {out_path} ({opaque_count} pixels, {size_kb:.1f} KB)")


if __name__ == "__main__":
    img = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "Images", "PixelArtBackground.png")
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "ImagesJson", "BackgroundPixels.compact.json")
    png_to_compact(img, out)
