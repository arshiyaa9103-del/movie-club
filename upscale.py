import sys
from PIL import Image

def upscale(input_path, output_path, factor=4):
    img = Image.open(input_path)
    # Using Nearest Neighbor to preserve pixel art
    new_size = (img.width * factor, img.height * factor)
    upscaled_img = img.resize(new_size, Image.NEAREST)
    upscaled_img.save(output_path)
    print(f"Upscaled {input_path} by {factor}x -> {output_path} ({new_size[0]}x{new_size[1]})")

if __name__ == "__main__":
    upscale("attached_assets/image_1779642008404.png", "artifacts/watchlist/public/logo.png", 2)
