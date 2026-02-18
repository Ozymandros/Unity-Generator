"""
Audio provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
Legacy constants ``AUDIO_KEY_MAP`` and ``AUDIO_PRIORITY`` are derived
from :pydata:`provider_registry`.
"""

from __future__ import annotations

import asyncio
from typing import Any

import nest_asyncio
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
    api_key = api_keys.get(key_name, "")

    # Create SK service
    service = provider_registry.create_text_to_audio_service(selected, api_key)

    # Setup Kernel
    kernel = Kernel()
    kernel.add_service(service)

    async def _run_audio():
        # SK's TextToAudioClientBase usually has get_audio_contents
        # For OpenAI it is get_audio_content
        # We pass prompt and settings. Settings can be dict or specific object.
        # OpenAITextToAudio settings: voice, speed, etc.

        # We need to constructing settings object if possible or pass dict
        # OpenAITextToAudio usually takes arguments in methods or via settings

        from semantic_kernel.connectors.ai.open_ai import OpenAITextToAudioExecutionSettings
        settings = OpenAITextToAudioExecutionSettings(
            ai_model_id=opts.get("model") or provider_registry.get(selected).default_models[Modality.AUDIO],
            input=prompt,
            voice=opts.get("voice", "alloy"), # 'alloy' is a standard OpenAI voice
            response_format=opts.get("format", "mp3"),
            speed=opts.get("speed", 1.0)
        )

        content = await service.get_audio_content(prompt, settings)
        return content

    try:
        audio_content = asyncio.run(_run_audio())
        # audio_content is usually AudioContent object with data (bytes) and/or uri

        import base64
        # If it has data, encode it
        final_data = None
        if hasattr(audio_content, 'data') and audio_content.data:
             final_data = base64.b64encode(audio_content.data).decode('utf-8')
        elif hasattr(audio_content, 'uri') and audio_content.uri:
             final_data = audio_content.uri

    except Exception as e:
        raise RuntimeError(f"Semantic Kernel audio generation failed: {e}") from e

    return AgentResult(
        content=final_data, # Return base64 or URI as content
        provider=selected,
        model=opts.get("model") or "default",
        metadata=getattr(audio_content, 'metadata', {})
    )
