from typing import Any

from backend.app.prompts import DEFAULT_CODE_SYSTEM_PROMPT
from backend.app.schemas import AgentResult, CodeOptions
from services.llm_provider import generate_text


def run(
    prompt: str,
    provider: str | None,
    options: CodeOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    effective_system_prompt = system_prompt or DEFAULT_CODE_SYSTEM_PROMPT
    return generate_text(prompt, provider, options, api_keys, system_prompt=effective_system_prompt)
