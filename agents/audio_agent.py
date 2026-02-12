from typing import Any, Dict, Optional, Union
from services.audio_provider import generate_audio
from backend.app.schemas import AgentResult, AudioOptions


def run(
    prompt: str,
    provider: Optional[str],
    options: AudioOptions | Dict[str, Any],
    api_keys: Dict[str, str],
) -> AgentResult:
    return generate_audio(prompt, provider, options, api_keys)
