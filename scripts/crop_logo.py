from PIL import Image

img = Image.open('artifacts/watchlist/public/logo.png')
img = img.convert('RGB')
width, height = img.size

# Find the first non-black, non-background pixel row?
# Let's just crop out the top 25% of the image as a test.
crop_y = int(height * 0.25)
cropped = img.crop((0, crop_y, width, height))
cropped.save('artifacts/watchlist/public/logo.png')
print(f"Cropped image from {img.size} to {cropped.size}")

