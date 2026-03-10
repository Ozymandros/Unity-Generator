from typing import Any

from ..schemas import AgentResult, TextOptions
from ..services.llm_provider import generate_text
from .base import SyncAgent


class TextAgent(SyncAgent):
    """Agent specialized for text generation."""

    def run(
        self,
        prompt: str,
        provider: str | None,
        options: TextOptions | dict[str, Any],
        api_keys: dict[str, str],
        system_prompt: str | None = None,
    ) -> AgentResult:
        return generate_text(prompt, provider, options, api_keys, system_prompt)
