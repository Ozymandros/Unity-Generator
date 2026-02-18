"""
LLM provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
The legacy constants ``LLM_KEY_MAP`` and ``LLM_PRIORITY`` are derived
from :pydata:`provider_registry` so there is a single source of truth.
"""

from __future__ import annotations

import asyncio
from typing import Any

import nest_asyncio
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings
from semantic_kernel.contents import ChatHistory

from ..schemas import AgentResult, CodeOptions, TextOptions
from .providers import Modality, provider_registry

# Apply nest_asyncio to allow nested event loops if necessary
nest_asyncio.apply()

# Legacy constants for agent_manager
LLM_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.LLM)
LLM_PRIORITY: list[str] = provider_registry.priority_list(Modality.LLM)

def generate_text(
    prompt: str,
    provider: str | None,
    options: TextOptions | CodeOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate text using the best available LLM provider via Semantic Kernel.
    """
    selected = provider_registry.resolve(Modality.LLM, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    # Create SK service
    service = provider_registry.create_chat_service(selected, api_key)

    # Setup Kernel
    kernel = Kernel()
    kernel.add_service(service)

    # Configure settings
    # We assume OpenAI-compatible settings for now as that's what our factory produces
    settings = OpenAIChatPromptExecutionSettings(
        service_id=selected,
        ai_model_id=opts.get("model") or provider_registry.get(selected).default_models[Modality.LLM],
        temperature=opts.get("temperature", 0.7),
        max_tokens=opts.get("max_tokens", 1000),
        top_p=opts.get("top_p", 1.0),
    )

    async def _run_sk():
        chat = ChatHistory()
        if system_prompt:
            chat.add_system_message(system_prompt)
        chat.add_user_message(prompt)

        response = await service.get_chat_message_content(
            chat_history=chat,
            settings=settings
        )
        return str(response)

    try:
        content = asyncio.run(_run_sk())
    except Exception as e:
         # Map SK errors to ProviderError if needed, or plug into existing error handling
         # For now, re-raise or let it bubble up
         raise RuntimeError(f"Semantic Kernel invocation failed: {e}") from e

    return AgentResult(
        content=content,
        provider=selected,
        model=settings.ai_model_id,
        metadata={}
    )
