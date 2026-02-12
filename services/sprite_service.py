import base64
import io
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image
import numpy as np

from services.image_provider import generate_image
from backend.app.config import load_api_keys
from app.schemas import AgentResult, ImageOptions

def generate_sprite(
    prompt: str,
    provider: Optional[str],
    api_key: Optional[str],
    resolution: int,
    options: ImageOptions | Dict[str, Any]
) -> AgentResult:
    """
    Generates a sprite using the specified provider and applies pixel-art processing.
    """
    
    # 1. Enhance prompt for pixel art if not already present
    enhanced_prompt = prompt
    if "pixel" not in prompt.lower():
        enhanced_prompt = f"{prompt}, pixel art style, flat color, isolated on transparent background"
    
    # 2. Determine base generation size
    opts = options if isinstance(options, ImageOptions) else ImageOptions(**options)
    gen_options = opts.copy(update={"aspect_ratio": "1:1"})
    
    # 3. Call Image Provider
    keys = load_api_keys()
    from services.image_provider import IMAGE_KEY_MAP
    if provider and api_key and provider in IMAGE_KEY_MAP:
         keys[IMAGE_KEY_MAP[provider]] = api_key

    response = generate_image(enhanced_prompt, provider, gen_options, keys)
    
    # 4. Process Image (Downscale -> Quantize -> Crop)
    image_data = response.image
    if not image_data:
        raise ValueError("No image data returned from provider")
    
    # Decode base64
    if image_data.startswith("http"):
        import requests
        resp = requests.get(image_data)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
    else:
        if "," in image_data:
            image_data = image_data.split(",")[1]
        img = Image.open(io.BytesIO(base64.b64decode(image_data)))

    img = img.convert("RGBA")
    
    # Process
    processed_img = process_pixel_art(img, resolution, opts.dict() if isinstance(opts, ImageOptions) else opts)
    
    # Encode back to base64
    buffered = io.BytesIO()
    processed_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return AgentResult(
        image=img_str,
        provider=response.provider,
        model=response.model,
        raw={
            "original_prompt": prompt,
            "enhanced_prompt": enhanced_prompt,
            "resolution": resolution,
        }
    )

def process_pixel_art(image: Image.Image, target_resolution: int, options: Dict[str, Any]) -> Image.Image:
    """
    Applies pixel art processing: Downscale, Quantize, Crop.
    """
    img_resized = image.resize((target_resolution, target_resolution), resample=Image.NEAREST)
    
    palette_size = options.get("palette_size", 32)
    if palette_size:
        alpha = img_resized.split()[3]
        rgb = img_resized.convert("RGB").quantize(colors=palette_size, method=Image.MAXCOVERAGE).convert("RGB")
        img_resized = Image.merge("RGBA", (*rgb.split(), alpha))
        
    if options.get("auto_crop", False):
        bbox = img_resized.getbbox()
        if bbox:
            img_resized = img_resized.crop(bbox)
            
    return img_resized

