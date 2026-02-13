from typing import Any

import requests
from app.schemas import AgentResult, ImageOptions

from .provider_select import select_provider

IMAGE_KEY_MAP = {
    "stability": "stability_api_key",
    "openai": "openai_api_key",
    "google": "google_api_key",
    "flux": "flux_api_key",
}

IMAGE_PRIORITY = ["stability", "openai", "google", "flux"]


def generate_image(
    prompt: str,
    provider: str | None,
    options: ImageOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    selected = select_provider(provider, api_keys, IMAGE_PRIORITY, IMAGE_KEY_MAP)

    # Prepend system prompt if provided
    effective_prompt = prompt
    if system_prompt:
        effective_prompt = f"{system_prompt}\n\n{prompt}"

    # Ensure options is a model
    opts = options if isinstance(options, ImageOptions) else ImageOptions(**options)

    if selected == "openai":
        return _call_openai_image(effective_prompt, opts, api_keys[IMAGE_KEY_MAP[selected]])
    if selected == "google":
        return _call_google_image(effective_prompt, opts, api_keys[IMAGE_KEY_MAP[selected]])
    if selected == "stability":
        return _call_stability(effective_prompt, opts, api_keys[IMAGE_KEY_MAP[selected]])
    if selected == "flux":
        return _call_flux(effective_prompt, opts, api_keys[IMAGE_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported image provider: {selected}")


def _call_openai_image(prompt: str, options: ImageOptions, api_key: str) -> AgentResult:
    # Placeholder for OpenAI DALL-E 3 API integration
    return AgentResult(image="base64_openai_stub", provider="openai", model="dall-e-3")


def _call_google_image(prompt: str, options: ImageOptions, api_key: str) -> AgentResult:
    # Placeholder for Google Imagen API integration
    return AgentResult(image="base64_google_stub", provider="google", model="imagen-3")


def _call_stability(prompt: str, options: ImageOptions, api_key: str) -> AgentResult:
    url = "https://api.stability.ai/v2beta/stable-image/generate/sd3"

    # Map quality to model: standard -> sd3-turbo, hd -> sd3
    quality = options.quality
    model = "sd3-turbo" if quality == "standard" else "sd3"

    payload = {
        "prompt": prompt,
        "aspect_ratio": options.aspect_ratio,
        "output_format": options.output_format,
        "model": model,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    response = requests.post(url, data=payload, headers=headers, timeout=120)
    response.raise_for_status()
    data = response.json()
    return AgentResult(
        image=data.get("image"),
        provider="stability",
        raw=data,
        model=model,
    )


def _call_flux(prompt: str, options: ImageOptions, api_key: str) -> AgentResult:
    url = "https://api.replicate.com/v1/predictions"

    # Map quality to version: standard -> flux-schnell, hd -> flux-dev
    quality = options.quality
    default_version = "flux-schnell" if quality == "standard" else "flux-dev"
    version = getattr(
        options, "version", default_version
    )  # Use getattr if version might be in Dict but not in Model yet

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
    return AgentResult(
        image=data.get("output"),
        provider="flux",
        raw=data,
        model=version,
    )
