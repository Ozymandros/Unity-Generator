from typing import Any

from ..schemas import AgentResult, AudioOptions
from ..services.audio_provider import generate_audio


def run(
    prompt: str,
    provider: str | None,
    options: AudioOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    return generate_audio(prompt, provider, options, api_keys, system_prompt)
