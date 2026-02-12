from typing import Any, Dict, Optional, Union
from services.llm_provider import generate_text
from backend.app.schemas import AgentResult, TextOptions


def run(
    prompt: str,
    provider: Optional[str],
    options: TextOptions | Dict[str, Any],
    api_keys: Dict[str, str],
) -> AgentResult:
    return generate_text(prompt, provider, options, api_keys)
