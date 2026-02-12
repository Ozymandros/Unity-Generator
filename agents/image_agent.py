from typing import Any

from backend.app.schemas import AgentResult, ImageOptions
from services.image_provider import generate_image


def run(
    prompt: str,
    provider: str | None,
    options: ImageOptions | dict[str, Any],
    api_keys: dict[str, str],
) -> AgentResult:
    return generate_image(prompt, provider, options, api_keys)
