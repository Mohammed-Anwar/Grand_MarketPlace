import os
from PIL import Image, ImageDraw, ImageFont

def label_sprite_sheet(image_path, sprite_w=16, sprite_h=16, cols=8, rows=8):
    if not os.path.exists(image_path):
        print(f"Error: Could not find the file '{image_path}'")
        return

    # Load the original image
    img = Image.open(image_path).convert("RGBA")
    
    # Scale the image up (e.g., 4x) so the numbers are actually readable!
    # A 16x16 block is too small to draw "63" clearly.
    scale = 4
    scaled_w = img.width * scale
    scaled_h = img.height * scale
    
    # Resampling with NEAREST keeps your beautiful pixel art perfectly crisp
    img_scaled = img.resize((scaled_w, scaled_h), Image.Resampling.NEAREST)
    draw = ImageDraw.Draw(img_scaled)
    
    # Use a default basic font
    try:
        # Tries to find a clean system font if possible, falls back to default
        font = ImageFont.load_default()
    except IOError:
        font = ImageFont.load_default()

    scaled_sprite_w = sprite_w * scale
    scaled_sprite_h = sprite_h * scale

    for row in range(rows):
        for col in range(cols):
            # Calculate the sequential frame index (0-63)
            frame_idx = row * cols + col
            
            # Find the top-left coordinate of this sprite block on the scaled sheet
            x = col * scaled_sprite_w
            y = row * scaled_sprite_h
            
            # Draw a subtle background outline box behind the text to make it readable
            draw.rectangle([x + 2, y + 2, x + 22, y + 15], fill=(0, 0, 0, 180))
            
            # Write the frame ID number onto the sprite corner (in bright yellow)
            draw.text((x + 4, y + 2), str(frame_idx), fill=(255, 215, 0, 255), font=font)

    # Save the reference map sheet
    output_path = "food_sheet_numbered.png"
    img_scaled.save(output_path)
    print(f"Success! Numbered asset map saved as: '{output_path}'")

# Run the script
if __name__ == "__main__":
    # Change 'food_sheet.png' if your asset file has a different name or path locally
    label_sprite_sheet("food_sheet.png")