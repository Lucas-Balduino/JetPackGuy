from PIL import Image
import json
import os

# Caminho da sua imagem
img_path = r"Aula29.04\JetPack\PixelArtJetPackGuy.png"
img = Image.open(img_path).convert("RGBA")
pixels = img.load()
width, height = img.size

pixel_data = []

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 0:  # Considera apenas pixels visíveis (não transparentes)
            pixel_data.append({
                "x": x,
                "y": y,
                "color": f"rgba({r}, {g}, {b}, {a / 255})"
            })

# Caminho da pasta Downloads do usuário atual
downloads_folder = os.path.join(os.path.expanduser("~"), "Downloads")
json_path = os.path.join(downloads_folder, "pixels.json")

# Salva o arquivo JSON
with open(json_path, "w") as f:
    json.dump(pixel_data, f, indent=2)

print(f"Arquivo salvo em: {json_path}")