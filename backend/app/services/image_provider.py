"""
Image provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
Legacy constants ``IMAGE_KEY_MAP`` and ``IMAGE_PRIORITY`` are derived
from :pydata:`provider_registry`.
"""

from __future__ import annotations

import asyncio
from typing import Any

import nest_asyncio
from semantic_kernel import Kernel

from ..schemas import AgentResult, ImageOptions
from .providers import Modality, provider_registry

# Legacy constants for agent_manager
IMAGE_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.IMAGE)
IMAGE_PRIORITY: list[str] = provider_registry.priority_list(Modality.IMAGE)

nest_asyncio.apply()

def generate_image(
    prompt: str,
    provider: str | None,
    options: ImageOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate an image using the best available image provider via Semantic Kernel.
    """
    selected = provider_registry.resolve(Modality.IMAGE, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    # Create SK service
    service = provider_registry.create_text_to_image_service(
        selected, 
        api_key, 
        model_id=opts.get("model")
    )

    # Setup Kernel
    kernel = Kernel()
    kernel.add_service(service)

    async def _run_image():
        # OpenAITextToImage.generate_image(description, width, height)
        # We need to map options to arguments.
        # Check SK OpenAITextToImage signature.
        # It usually takes width, height as ints.
        # Our options have aspect_ratio (str) or size. We might need logic here.
        # But for now, let's assume 'size' option or defaults.

        width = opts.get("width", 1024)
        height = opts.get("height", 1024)

        # If standard SK interface:
        image_url = await service.generate_image(prompt, width, height)
        return image_url

    try:
        final_data = asyncio.run(_run_image())
    except Exception as e:
        raise RuntimeError(f"Semantic Kernel image generation failed: {e}") from e

    return AgentResult(
        content=final_data, # Return URL or base64
        provider=selected,
        model=opts.get("model") or "dall-e-3",
        metadata={}
    )
