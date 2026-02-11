import base64
import io
from typing import Dict, Any, List, Tuple
from PIL import Image
import numpy as np

from services.image_provider import generate_image
from app.config import load_api_keys

def generate_sprite(
    prompt: str,
    provider: str | None,
    api_key: str | None,
    resolution: int,
    options: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generates a sprite using the specified provider and applies pixel-art processing.
    """
    
    # 1. Enhance prompt for pixel art if not already present
    enhanced_prompt = prompt
    if "pixel" not in prompt.lower():
        enhanced_prompt = f"{prompt}, pixel art style, flat color, isolated on transparent background"
    
    # 2. Determine base generation size (providers usually need larger sizes, e.g. 1024x1024)
    # We will downscale later to achieve the 'resolution' target (e.g. 64x64)
    gen_options = options.copy()
    gen_options["aspect_ratio"] = "1:1" # Force square for single sprites
    
    # 3. Call Image Provider
    keys = load_api_keys()
    if api_key:
        # Override if specific key provided
        # Note: image_provider logic handles key mapping. 
        # We need to ensure we pass a dict correctly or rely on image_provider to use the right key from the dict.
        # implementation of generate_image takes a dict of keys.
        # We'll patch the keys dict.
        # But wait, generate_image expects a provider name and a dict of all keys.
        # So we should update the specific key in the dict.
        # We need to know which key to update. provider_select logic does that.
        # Let's simple pass the keys we loaded + override.
        pass # Logic handled by caller or we do it here? 
        # Actually generate_image takes (prompt, provider, options, api_keys).
        # We can just update the api_keys dict if we know the mapping, or trust the caller?
        # Let's look at how AgentManager does it. It updates the specific key in the dict.
        # We can duplicate that logic or just accept api_keys as an argument to this service.
        # For now, let's assume we can update keys if provider is known.
        pass

    # For now, let's load keys and if api_key is passed, we might need to map it.
    # Simpler: The caller (main.py -> new endpoint) should probably handle key injection into the dict
    # OR we follow the pattern: load_api_keys(), update if custom key, pass to provider.
    
    # Let's map provider to key name to support the override
    from services.image_provider import IMAGE_KEY_MAP
    if provider and api_key and provider in IMAGE_KEY_MAP:
         keys[IMAGE_KEY_MAP[provider]] = api_key

    response = generate_image(enhanced_prompt, provider, gen_options, keys)
    
    # 4. Process Image (Downscale -> Quantize -> Crop)
    image_data = response.get("image")
    if not image_data:
        raise ValueError("No image data returned from provider")
    
    # Decode base64
    if image_data.startswith("http"):
        # If URL (like DALL-E sometimes or Flux), we need to fetch it.
        # For this implementation, let's assume base64 or implement fetch.
        import requests
        resp = requests.get(image_data)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
    else:
         # Check for data:image/png;base64 header
        if "," in image_data:
            image_data = image_data.split(",")[1]
        img = Image.open(io.BytesIO(base64.b64decode(image_data)))

    # Ensure RGBA
    img = img.convert("RGBA")
    
    # Process
    processed_img = process_pixel_art(img, resolution, options)
    
    # Encode back to base64
    buffered = io.BytesIO()
    processed_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {
        "image": img_str,
        "original_prompt": prompt,
        "enhanced_prompt": enhanced_prompt,
        "resolution": resolution,
        "provider": response.get("provider")
    }

def process_pixel_art(image: Image.Image, target_resolution: int, options: Dict[str, Any]) -> Image.Image:
    """
    Applies pixel art processing: Downscale, Quantize, Crop.
    """
    # 1. Downscale using Nearest Neighbor
    # Current size
    w, h = image.size
    
    # We want to fit into target_resolution x target_resolution
    # preserving aspect ratio if needed, but for sprites usually 1:1
    img_resized = image.resize((target_resolution, target_resolution), resample=Image.NEAREST)
    
    # 2. Palette Quantization
    palette_size = options.get("palette_size", 32) # Default 32 colors
    if palette_size:
        # Quantize to reduce colors, keeping alpha
        # Standardize RGBA to P then back to RGBA often loses Alpha precision or messes it up.
        # A simple way for pixel art:
        # separate alpha, quantize RGB, combine.
        alpha = img_resized.split()[3]
        rgb = img_resized.convert("RGB").quantize(colors=palette_size, method=Image.MAXCOVERAGE).convert("RGB")
        img_resized = Image.merge("RGBA", (*rgb.split(), alpha))
        
    # 3. Auto Crop (Trim transparent edges) - Optional
    if options.get("auto_crop", False):
        bbox = img_resized.getbbox()
        if bbox:
            img_resized = img_resized.crop(bbox)
            
    return img_resized
