from PIL import Image

img = Image.open('artifacts/watchlist/public/logo.png')
img = img.convert('RGB')
width, height = img.size

# The title bar is at the top. Let's look at the color of the pixel at (10, 10).
# Actually, let's find the window border first.
for y in range(0, 100):
    row_colors = []
    for x in range(0, 100):
        row_colors.append(img.getpixel((x, y)))
    # print(f"Y={y}: {row_colors[:10]}")

# Let's just find the blue color of the title bar. 
# We'll sample colors in the top 20% of the image.
from collections import Counter
colors = []
for y in range(int(height*0.05), int(height*0.2)):
    for x in range(int(width*0.05), int(width*0.2)):
        colors.append(img.getpixel((x, y)))

most_common = Counter(colors).most_common(5)
print("Most common colors in top-left region:", most_common)

