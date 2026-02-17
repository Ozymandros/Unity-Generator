from typing import Any

from ..services.prompts import DEFAULT_TEXT_SYSTEM_PROMPT
from ..schemas import AgentResult, TextOptions
from ..services.llm_provider import generate_text


def run(
    prompt: str,
    provider: str | None,
    options: TextOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    return generate_text(prompt, provider, options, api_keys, system_prompt)
