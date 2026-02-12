from typing import Any, Dict, Optional, Union
from services.image_provider import generate_image
from backend.app.schemas import AgentResult, ImageOptions


def run(
    prompt: str,
    provider: Optional[str],
    options: ImageOptions | Dict[str, Any],
    api_keys: Dict[str, str],
) -> AgentResult:
    return generate_image(prompt, provider, options, api_keys)
