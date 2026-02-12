from typing import Any

from backend.app.schemas import AgentResult, TextOptions
from services.llm_provider import generate_text


def run(
    prompt: str,
    provider: str | None,
    options: TextOptions | dict[str, Any],
    api_keys: dict[str, str],
) -> AgentResult:
    return generate_text(prompt, provider, options, api_keys)
