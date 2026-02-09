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
    payload = {
        "prompt": prompt,
        "aspect_ratio": options.get("aspect_ratio", "1:1"),
        "output_format": options.get("output_format", "png"),
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
    }


def _call_flux(prompt: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.replicate.com/v1/predictions"
    payload = {
        "version": options.get("version", "flux-dev"),
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
    }
