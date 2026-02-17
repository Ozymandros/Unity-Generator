"""
Video provider service.

Follows the same pattern as the LLM / image / audio provider services:
delegates provider selection to the central registry and dispatches
to the matching adapter.

All adapters are currently stubs; adding a real provider only requires
implementing the adapter's ``_do_invoke`` method.
"""

from __future__ import annotations

from typing import Any

from ..schemas import AgentResult, VideoOptions
from .providers import Modality, provider_registry
from .providers.video_adapters import VIDEO_ADAPTERS

# ---------------------------------------------------------------------------
# Legacy-style constants (derived from registry)
# ---------------------------------------------------------------------------

VIDEO_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.VIDEO)
"""Mapping ``provider_name -> api_key_name`` for video providers."""

VIDEO_PRIORITY: list[str] = provider_registry.priority_list(Modality.VIDEO)
"""Ordered fallback list for video providers."""


# ---------------------------------------------------------------------------
# Public function
# ---------------------------------------------------------------------------


def generate_video(
    prompt: str,
    provider: str | None,
    options: VideoOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate a video using the best available video provider.

    Args:
        prompt: Description of the desired video.
        provider: Optional preferred provider name.
        options: Video generation options (duration, aspect_ratio, ...).
        api_keys: Currently loaded API keys.
        system_prompt: Optional system prompt.

    Returns:
        :class:`AgentResult` with video data (URL or base64).

    Raises:
        ProviderNotSupportedError: If *provider* is unknown or the
            selected adapter is not yet implemented.
        ProviderNotAvailableError: If no provider has a valid key.
        RuntimeError: If the selected provider has no adapter.

    Example:
        >>> result = generate_video(
        ...     "A sunrise over mountains", "runway",
        ...     {"duration": 5},
        ...     {"runway_api_key": "key-xxx"},
        ... )  # doctest: +SKIP
    """
    selected = provider_registry.resolve(Modality.VIDEO, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    adapter = VIDEO_ADAPTERS.get(selected)
    if adapter is None:
        raise RuntimeError(f"No video adapter registered for provider: {selected}")

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    return adapter.invoke(prompt, opts, api_key, system_prompt)
