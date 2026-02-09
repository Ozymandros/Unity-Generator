from typing import Any, Dict, Optional

from services.audio_provider import generate_audio


def run(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    return generate_audio(prompt, provider, options, api_keys)
