"""
Concrete image-generation adapter implementations.

Each adapter wraps the HTTP call to a single image provider and returns
a normalised :class:`AgentResult`.
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import requests

from app.schemas import AgentResult, ImageOptions

from .adapters import BaseProviderAdapter
from .capabilities import Modality

LOGGER = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Helper to coerce options
# ------------------------------------------------------------------


def _to_image_opts(options: dict[str, Any]) -> ImageOptions:
    """
    Ensure *options* is an :class:`ImageOptions` instance.

    Args:
        options: Raw options dictionary.

    Returns:
        Validated :class:`ImageOptions`.

    Example:
        >>> opts = _to_image_opts({"quality": "hd"})
        >>> opts.quality
        'hd'
    """
    if isinstance(options, ImageOptions):
        return options
    return ImageOptions(**options)


# ------------------------------------------------------------------
# OpenAI DALL-E 3
# ------------------------------------------------------------------


class OpenAIImageAdapter(BaseProviderAdapter):
    """
    Generate images via the OpenAI DALL-E 3 API.

    Docs: https://platform.openai.com/docs/guides/images
    """

    def __init__(self) -> None:
        super().__init__(Modality.IMAGE, "openai")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call the OpenAI images/generations endpoint.

        Args:
            prompt: Image description.
            options: Should contain ``quality``, ``aspect_ratio``.
            api_key: OpenAI bearer token.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with base64 image data.
        """
        opts = _to_image_opts(options)
        effective_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        size_map = {"1:1": "1024x1024", "9:16": "1024x1792", "16:9": "1792x1024"}
        size = size_map.get(opts.aspect_ratio, "1024x1024")
        quality = opts.quality if opts.quality in ("standard", "hd") else "standard"

        payload = {
            "model": "dall-e-3",
            "prompt": effective_prompt,
            "n": 1,
            "quality": quality,
            "size": size,
            "response_format": "b64_json",
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            json=payload, headers=headers, timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        image_b64 = data["data"][0]["b64_json"]
        revised_prompt = data["data"][0].get("revised_prompt", prompt)

        return AgentResult(
            image=image_b64,
            provider="openai",
            model="dall-e-3",
            raw={"revised_prompt": revised_prompt, "size": size, "quality": quality},
        )


# ------------------------------------------------------------------
# Google Imagen
# ------------------------------------------------------------------


class GoogleImageAdapter(BaseProviderAdapter):
    """
    Generate images via Google Imagen 3/4.

    Requires: ``pip install google-genai``
    """

    def __init__(self) -> None:
        super().__init__(Modality.IMAGE, "google")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call Google Imagen via the ``google-genai`` SDK.

        Args:
            prompt: Image description.
            options: Should contain ``quality``, ``aspect_ratio``, optional ``model``.
            api_key: Google API key.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with base64 image data.

        Raises:
            RuntimeError: If the ``google-genai`` package is not installed
                          or the API returns no images.
        """
        try:
            from google import genai  # type: ignore[import-not-found]
            from google.genai import types  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError(
                "google-genai library not installed. Install it with: pip install google-genai"
            ) from exc

        opts = _to_image_opts(options)
        effective_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        client = genai.Client(api_key=api_key)
        image_size = "2K" if opts.quality == "hd" else "1K"
        aspect_ratio = opts.aspect_ratio if opts.aspect_ratio in ("1:1", "3:4", "4:3", "9:16", "16:9") else "1:1"
        model = opts.model if opts.model else "imagen-3.0-generate-001"

        resp = client.models.generate_images(
            model=model,
            prompt=effective_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                image_size=image_size,
                person_generation="allow_adult",
            ),
        )
        if not resp.generated_images:
            raise RuntimeError("No images generated by Google Imagen")

        image_bytes = resp.generated_images[0].image.image_bytes
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        return AgentResult(
            image=image_b64,
            provider="google",
            model=model,
            raw={"aspect_ratio": aspect_ratio, "image_size": image_size},
        )


# ------------------------------------------------------------------
# Stability AI
# ------------------------------------------------------------------


class StabilityImageAdapter(BaseProviderAdapter):
    """Generate images via Stability AI (Stable Diffusion 3)."""

    def __init__(self) -> None:
        super().__init__(Modality.IMAGE, "stability")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call the Stability AI SD3 endpoint.

        Args:
            prompt: Image description.
            options: Should contain ``quality``, ``aspect_ratio``, ``output_format``.
            api_key: Stability bearer token.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with image data from Stability.
        """
        opts = _to_image_opts(options)
        effective_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        model = "sd3-turbo" if opts.quality == "standard" else "sd3"
        payload = {
            "prompt": effective_prompt,
            "aspect_ratio": opts.aspect_ratio,
            "output_format": opts.output_format,
            "model": model,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
        response = requests.post(
            "https://api.stability.ai/v2beta/stable-image/generate/sd3",
            data=payload, headers=headers, timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return AgentResult(
            image=data.get("image"),
            provider="stability",
            raw=data,
            model=str(model) if model is not None else None,
        )


# ------------------------------------------------------------------
# Flux (Replicate)
# ------------------------------------------------------------------


class FluxImageAdapter(BaseProviderAdapter):
    """Generate images via the Flux model on Replicate."""

    def __init__(self) -> None:
        super().__init__(Modality.IMAGE, "flux")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call the Replicate predictions endpoint for Flux.

        Args:
            prompt: Image description.
            options: Should contain ``quality``, optional ``version``.
            api_key: Replicate token.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with image output from Replicate.
        """
        opts = _to_image_opts(options)
        effective_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        default_version = "flux-schnell" if opts.quality == "standard" else "flux-dev"
        version = self.get_opt(options, "version", default_version)

        payload = {"version": version, "input": {"prompt": effective_prompt}}
        headers = {"Authorization": f"Token {api_key}", "Content-Type": "application/json"}
        response = requests.post(
            "https://api.replicate.com/v1/predictions",
            json=payload, headers=headers, timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return AgentResult(
            image=data.get("output"),
            provider="flux",
            raw=data,
            model=str(version) if version is not None else None,
        )


# ======================================================================
# Adapter lookup table
# ======================================================================

IMAGE_ADAPTERS: dict[str, BaseProviderAdapter] = {
    "openai": OpenAIImageAdapter(),
    "google": GoogleImageAdapter(),
    "stability": StabilityImageAdapter(),
    "flux": FluxImageAdapter(),
}
