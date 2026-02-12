from typing import Any

from backend.app.schemas import AgentResult, CodeOptions
from services.llm_provider import generate_text

SYSTEM_PROMPT = (
    "You are a senior Unity engineer. Return clean Unity C# scripts only, "
    "no markdown, no explanations. Provide complete classes."
)


def run(
    prompt: str,
    provider: str | None,
    options: CodeOptions | dict[str, Any],
    api_keys: dict[str, str],
) -> AgentResult:
    unity_prompt = f"{SYSTEM_PROMPT}\n\nUser request:\n{prompt}"
    return generate_text(unity_prompt, provider, options, api_keys)
