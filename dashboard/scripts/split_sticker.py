from PIL import Image
import os

img = Image.open('/Users/yuza/precision-irrigation-ml/dashboard/public/me.png')
width, height = img.size
print(f"Original size: {width}x{height}")

# Assume 5 columns x 2 rows for 10 frames
cols = 5
rows = 2
frame_width = width // cols
frame_height = height // rows

print(f"Frame size: {frame_width}x{frame_height}")

# Create output directory
output_dir = '/Users/yuza/precision-irrigation-ml/dashboard/public/sticker-frames'
os.makedirs(output_dir, exist_ok=True)

# Split into frames
frame_index = 0
for row in range(rows):
    for col in range(cols):
        left = col * frame_width
        top = row * frame_height
        right = left + frame_width
        bottom = top + frame_height
        
        frame = img.crop((left, top, right, bottom))
        frame.save(f'{output_dir}/frame_{frame_index:02d}.png')
        print(f"Saved frame_{frame_index:02d}.png")
        frame_index += 1

print(f"\nSplit {frame_index} frames into {output_dir}")
