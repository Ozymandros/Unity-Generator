"""
Image provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
Legacy constants ``IMAGE_KEY_MAP`` and ``IMAGE_PRIORITY`` are derived
from :pydata:`provider_registry`.
"""

from __future__ import annotations

from typing import Any

from ..schemas import AgentResult, ImageOptions
from .providers import Modality, provider_registry
from .providers.image_adapters import IMAGE_ADAPTERS

# ---------------------------------------------------------------------------
# Legacy constants (derived from registry for backward compatibility)
# ---------------------------------------------------------------------------

IMAGE_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.IMAGE)
"""Mapping ``provider_name -> api_key_name`` for image providers."""

IMAGE_PRIORITY: list[str] = provider_registry.priority_list(Modality.IMAGE)
"""Ordered fallback list for image providers."""


# ---------------------------------------------------------------------------
# Public function (signature unchanged)
# ---------------------------------------------------------------------------


def generate_image(
    prompt: str,
    provider: str | None,
    options: ImageOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate an image using the best available image provider.

    Args:
        prompt: Image description.
        provider: Optional preferred provider name.
        options: Image generation options (quality, aspect_ratio, ...).
        api_keys: Currently loaded API keys.
        system_prompt: Optional system prompt (prepended to the main prompt).

    Returns:
        :class:`AgentResult` with image data (base64 or URL).

    Raises:
        ProviderNotSupportedError: If *provider* is unknown.
        ProviderNotAvailableError: If no provider has a valid key.
        RuntimeError: If the selected provider has no adapter.

    Example:
        >>> result = generate_image(
        ...     "A forest at sunset", "stability",
        ...     {"quality": "hd"},
        ...     {"stability_api_key": "sk-xxx"},
        ... )  # doctest: +SKIP
    """
    selected = provider_registry.resolve(Modality.IMAGE, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    adapter = IMAGE_ADAPTERS.get(selected)
    if adapter is None:
        raise RuntimeError(f"No image adapter registered for provider: {selected}")

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    return adapter.invoke(prompt, opts, api_key, system_prompt)
