"""
Audio provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
Legacy constants ``AUDIO_KEY_MAP`` and ``AUDIO_PRIORITY`` are derived
from :pydata:`provider_registry`.
"""

from __future__ import annotations

from typing import Any

from ..schemas import AgentResult, AudioOptions
from .providers import Modality, provider_registry
from .providers.audio_adapters import AUDIO_ADAPTERS

# ---------------------------------------------------------------------------
# Legacy constants (derived from registry for backward compatibility)
# ---------------------------------------------------------------------------

AUDIO_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.AUDIO)
"""Mapping ``provider_name -> api_key_name`` for audio providers."""

AUDIO_PRIORITY: list[str] = provider_registry.priority_list(Modality.AUDIO)
"""Ordered fallback list for audio providers."""


# ---------------------------------------------------------------------------
# Public function (signature unchanged)
# ---------------------------------------------------------------------------


def generate_audio(
    prompt: str,
    provider: str | None,
    options: AudioOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate audio (TTS) using the best available audio provider.

    Args:
        prompt: Text to synthesise.
        provider: Optional preferred provider name.
        options: Audio generation options (voice, model_id, format, ...).
        api_keys: Currently loaded API keys.
        system_prompt: Optional system prompt (prepended to the text).

    Returns:
        :class:`AgentResult` with audio data (base64 or URL).

    Raises:
        ProviderNotSupportedError: If *provider* is unknown.
        ProviderNotAvailableError: If no provider has a valid key.
        RuntimeError: If the selected provider has no adapter.

    Example:
        >>> result = generate_audio(
        ...     "Hello world", "elevenlabs",
        ...     {"voice": "Rachel"},
        ...     {"elevenlabs_api_key": "key-xxx"},
        ... )  # doctest: +SKIP
    """
    selected = provider_registry.resolve(Modality.AUDIO, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    adapter = AUDIO_ADAPTERS.get(selected)
    if adapter is None:
        raise RuntimeError(f"No audio adapter registered for provider: {selected}")

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    return adapter.invoke(prompt, opts, api_key, system_prompt)
