from typing import Any, Dict, Optional, Union
from services.llm_provider import generate_text
from backend.app.schemas import AgentResult, CodeOptions


SYSTEM_PROMPT = (
    "You are a senior Unity engineer. Return clean Unity C# scripts only, "
    "no markdown, no explanations. Provide complete classes."
)


def run(
    prompt: str,
    provider: Optional[str],
    options: CodeOptions | Dict[str, Any],
    api_keys: Dict[str, str],
) -> AgentResult:
    unity_prompt = f"{SYSTEM_PROMPT}\n\nUser request:\n{prompt}"
    return generate_text(unity_prompt, provider, options, api_keys)
