from typing import Any, Dict, Optional

import requests

from .provider_select import select_provider


IMAGE_KEY_MAP = {
    "stability": "stability_api_key",
    "flux": "flux_api_key",
}

IMAGE_PRIORITY = ["stability", "flux"]


def generate_image(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    selected = select_provider(provider, api_keys, IMAGE_PRIORITY, IMAGE_KEY_MAP)
    if selected == "stability":
        return _call_stability(prompt, options, api_keys[IMAGE_KEY_MAP[selected]])
    if selected == "flux":
        return _call_flux(prompt, options, api_keys[IMAGE_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported image provider: {selected}")


def _call_stability(
    prompt: str, options: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
    
    # Map quality to model: standard -> sd3-turbo, hd -> sd3
    quality = options.get("quality", "standard")
    model = "sd3-turbo" if quality == "standard" else "sd3"
    
    payload = {
        "prompt": prompt,
        "aspect_ratio": options.get("aspect_ratio", "1:1"),
        "output_format": options.get("output_format", "png"),
        "model": model,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    response = requests.post(url, data=payload, headers=headers, timeout=120)
    response.raise_for_status()
    data = response.json()
    return {
        "image": data.get("image"),
        "provider": "stability",
        "raw": data,
        "model": model,
    }


def _call_flux(prompt: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.replicate.com/v1/predictions"
    
    # Map quality to version: standard -> flux-schnell, hd -> flux-dev
    # Note: These version strings might need to be exact Replicate model IDs or aliases.
    # Assuming the provider handles "flux-schnell" and "flux-dev" aliases or we use default.
    # For now, preserving existing default "flux-dev" if not generic.
    # Actually, let's just use the options.get("version") override if present, else map quality.
    
    quality = options.get("quality", "standard")
    default_version = "flux-schnell" if quality == "standard" else "flux-dev"
    version = options.get("version", default_version)

    payload = {
        "version": version,
        "input": {"prompt": prompt},
    }
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    data = response.json()
    return {
        "image": data.get("output"),
        "provider": "flux",
        "raw": data,
        "version": version,
    }
