from typing import Any, Dict, Optional

import requests

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
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    selected = select_provider(provider, api_keys, AUDIO_PRIORITY, AUDIO_KEY_MAP)
    if selected == "openai":
        return _call_openai_audio(prompt, options, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "google":
        return _call_google_audio(prompt, options, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "elevenlabs":
        return _call_elevenlabs(prompt, options, api_keys[AUDIO_KEY_MAP[selected]])
    if selected == "playht":
        return _call_playht(prompt, options, api_keys[AUDIO_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported audio provider: {selected}")


def _call_openai_audio(text: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    # Placeholder for OpenAI TTS API integration
    return {"audio_bytes": b"openai_audio_stub", "provider": "openai"}


def _call_google_audio(text: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    # Placeholder for Google Cloud TTS API integration
    return {"audio_bytes": b"google_audio_stub", "provider": "google"}


def _call_elevenlabs(
    text: str, options: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    voice_id = options.get("voice_id", "Rachel")
    model_id = options.get("model_id", "eleven_multilingual_v2")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": options.get("stability", 0.5),
            "similarity_boost": options.get("similarity_boost", 0.75),
        },
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    return {"audio_bytes": response.content, "provider": "elevenlabs"}


def _call_playht(
    text: str, options: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    url = "https://api.play.ht/api/v2/tts"
    payload = {
        "text": text,
        "voice": options.get("voice", "s3://voice-cloning-zero-shot/unknown"),
        "output_format": options.get("output_format", "mp3"),
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    data = response.json()
    return {"audio_url": data.get("url"), "provider": "playht", "raw": data}
