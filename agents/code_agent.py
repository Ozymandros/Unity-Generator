from typing import Any, Dict, Optional

from services.llm_provider import generate_text


SYSTEM_PROMPT = (
    "You are a senior Unity engineer. Return clean Unity C# scripts only, "
    "no markdown, no explanations. Provide complete classes."
)


def run(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    unity_prompt = f"{SYSTEM_PROMPT}\n\nUser request:\n{prompt}"
    return generate_text(unity_prompt, provider, options, api_keys)
