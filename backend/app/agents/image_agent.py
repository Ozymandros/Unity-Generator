from typing import Any

from ..schemas import AgentResult, ImageOptions
from ..services.image_provider import generate_image
from .base import SyncAgent


class ImageAgent(SyncAgent):
    """Agent specialized for image generation."""

    def run(
        self,
        prompt: str,
        provider: str | None,
        options: ImageOptions | dict[str, Any],
        api_keys: dict[str, str],
        system_prompt: str | None = None,
    ) -> AgentResult:
        return generate_image(prompt, provider, options, api_keys, system_prompt)
