from typing import Any

import requests

# Use TYPE_CHECKING to avoid circular imports if necessary,
# though here it's likely just about mypy path.
from app.schemas import AgentResult, AudioOptions

from .provider_select import select_provider

AUDIO_KEY_MAP = {
    "elevenlabs": "elevenlabs_api_key",
    "openai": "openai_api_key",
    "google": "google_api_key",
    "playht": "playht_api_key",
}

AUDIO_PRIORITY = ["elevenlabs", "openai", "google", "playht"]


def generate_audio(
    prompt: str,
    provider: str | None,
    options: AudioOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    selected = select_provider(provider, api_keys, AUDIO_PRIORITY, AUDIO_KEY_MAP)

    # Prepend system prompt if provided
    effective_text = prompt
    if system_prompt:
        effective_text = f"{system_prompt}\n\n{prompt}"

    opts = options if isinstance(options, AudioOptions) else AudioOptions(**options)

    if selected == "openai":
        return _call_openai_audio(effective_text, opts, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "google":
        return _call_google_audio(effective_text, opts, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "elevenlabs":
        return _call_elevenlabs(effective_text, opts, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "playht":
        return _call_playht(effective_text, opts, api_keys[AUDIO_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported audio provider: {selected}")


def _call_openai_audio(text: str, options: AudioOptions, api_key: str) -> AgentResult:
    # Placeholder for OpenAI TTS API integration
    return AgentResult(audio="openai_audio_stub", provider="openai")


def _call_google_audio(text: str, options: AudioOptions, api_key: str) -> AgentResult:
    # Placeholder for Google Cloud TTS API integration
    return AgentResult(audio="google_audio_stub", provider="google")


def _call_elevenlabs(text: str, options: AudioOptions, api_key: str) -> AgentResult:
    # Use getattr or check __dict__ if needed, but AudioOptions has specific fields
    voice_id = getattr(options, "voice", "Rachel")
    model_id = getattr(options, "model_id", "eleven_multilingual_v2")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": getattr(options, "stability", 0.5),
            "similarity_boost": getattr(options, "similarity_boost", 0.75),
        },
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    # Note: Returning content as string placeholder or actual bytes if handled elsewhere
    # AgentResult expects Optional[str] for audio, might need base64
    import base64

    audio_data = base64.b64encode(response.content).decode("utf-8")
    return AgentResult(audio=audio_data, provider="elevenlabs")


def _call_playht(text: str, options: AudioOptions, api_key: str) -> AgentResult:
    url = "https://api.play.ht/api/v2/tts"
    payload = {
        "text": text,
        "voice": options.voice,
        "output_format": options.format,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    data = response.json()
    return AgentResult(audio=data.get("url"), provider="playht", raw=data)
