from typing import Any

from ..schemas import AgentResult, AudioOptions
from ..services.audio_provider import generate_audio
from .base import SyncAgent


class AudioAgent(SyncAgent):
    """Agent specialized for audio generation."""

    def run(
        self,
        prompt: str,
        provider: str | None,
        options: AudioOptions | dict[str, Any],
        api_keys: dict[str, str],
        system_prompt: str | None = None,
    ) -> AgentResult:
        return generate_audio(prompt, provider, options, api_keys, system_prompt)
