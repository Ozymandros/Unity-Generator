from typing import Any, Dict, Optional

from services.llm_provider import generate_text


def run(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    return generate_text(prompt, provider, options, api_keys)
