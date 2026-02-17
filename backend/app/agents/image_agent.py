from typing import Any

from ..services.prompts import DEFAULT_IMAGE_SYSTEM_PROMPT
from ..schemas import AgentResult, ImageOptions
from ..services.image_provider import generate_image


def run(
    prompt: str,
    provider: str | None,
    options: ImageOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    return generate_image(prompt, provider, options, api_keys, system_prompt)
