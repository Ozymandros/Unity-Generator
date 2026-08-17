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
    """
    selected = provider_registry.resolve(Modality.VIDEO, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    return AgentResult(
        content=(
            f"Video generation is not yet connected to a live provider. "
            f"Requested: {prompt[:120]}{'...' if len(prompt) > 120 else ''} "
            f"(provider={selected}, duration={opts.get('duration', 5)}s, "
            f"resolution={opts.get('resolution', '720p')})."
        ),
        provider=selected,
        model=opts.get("model") or provider_registry.get(selected).default_models[Modality.VIDEO],
        metadata={
            "status": "stub",
            "duration": opts.get("duration", 5),
            "aspect_ratio": opts.get("aspect_ratio", "16:9"),
            "resolution": opts.get("resolution", "720p"),
            "fps": opts.get("fps", 24),
        },
    )

