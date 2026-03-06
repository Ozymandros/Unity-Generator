"""
Audio provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
Legacy constants ``AUDIO_KEY_MAP`` and ``AUDIO_PRIORITY`` are derived
from :pydata:`provider_registry`.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import nest_asyncio

LOGGER = logging.getLogger(__name__)
from semantic_kernel import Kernel

from ..schemas import AgentResult, AudioOptions
from .providers import Modality, provider_registry

# Legacy constants for agent_manager
AUDIO_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.AUDIO)
AUDIO_PRIORITY: list[str] = provider_registry.priority_list(Modality.AUDIO)

nest_asyncio.apply()

def generate_audio(
    prompt: str,
    provider: str | None,
    options: AudioOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate audio (TTS) using the best available audio provider via Semantic Kernel.
    """
    selected = provider_registry.resolve(Modality.AUDIO, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "") if key_name else ""

    # Create SK service
    service = provider_registry.create_text_to_audio_service(
        selected, 
        api_key, 
        model_id=opts.get("model")
    )

    # Setup Kernel
    kernel = Kernel()
    kernel.add_service(service)

    async def _run_audio():
        # Correctly instantiate settings based on the service/provider type
        settings = service.instantiate_prompt_execution_settings(
            ai_model_id=opts.get("model") or provider_registry.get(selected).default_models[Modality.AUDIO],
            input=prompt
        )

        # Apply settings dynamically with robust validation handling
        voice_to_set = opts.get("voice")

        try:
            if hasattr(settings, "voice") and voice_to_set:
                # Some settings (OpenAI) have strict literals. 
                # We try to set it, if it fails validation, we fallback.
                try:
                    settings.voice = voice_to_set
                except Exception:
                    LOGGER.warning(f"Voice '{voice_to_set}' is not supported by {selected}. Falling back to default.")
                    # If it's OpenAI, we know 'alloy' is safe. Others might not have a 'voice' property if they fail.
                    if selected == "openai":
                        settings.voice = "alloy"

            if hasattr(settings, "response_format"):
                 settings.response_format = opts.get("format", "mp3")

            if hasattr(settings, "speed"):
                 settings.speed = opts.get("speed", 1.0)

        except Exception as e:
            LOGGER.error(f"Error applying audio settings for {selected}: {e}")

        # Handle service call
        if hasattr(service, "get_audio_content"):
            content = await service.get_audio_content(prompt, settings)
        else:
            results = await service.get_audio_contents(prompt, settings)
            content = results[0] if results else None

        return content

    try:
        audio_content = asyncio.run(_run_audio())
        # audio_content is usually AudioContent object with data (bytes) and/or uri

        import base64
        # If it has data, encode it
        final_data = None
        if audio_content:
            if hasattr(audio_content, 'data') and audio_content.data:
                final_data = base64.b64encode(audio_content.data).decode('utf-8')
            elif hasattr(audio_content, 'uri') and audio_content.uri:
                final_data = audio_content.uri

    except Exception as e:
        raise RuntimeError(f"Semantic Kernel audio generation failed: {e}") from e

    metadata = getattr(audio_content, 'metadata', {})
    if not isinstance(metadata, dict):
        try:
            metadata = dict(metadata)
        except (TypeError, ValueError):
            metadata = {}

    return AgentResult(
        content=final_data, # Return base64 or URI as content
        provider=selected,
        model=opts.get("model") or "default",
        metadata=metadata
    )
