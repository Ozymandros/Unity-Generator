"""
LLM provider service -- public API unchanged.

Internally delegates to the unified provider registry and adapter layer.
The legacy constants ``LLM_KEY_MAP`` and ``LLM_PRIORITY`` are derived
from :pydata:`provider_registry` so there is a single source of truth.
"""

from __future__ import annotations

from typing import Any

from ..schemas import AgentResult, CodeOptions, TextOptions

from .providers import Modality, provider_registry
from .providers.llm_adapters import LLM_ADAPTERS

# ---------------------------------------------------------------------------
# Legacy constants (derived from registry for backward compatibility)
# ---------------------------------------------------------------------------

LLM_KEY_MAP: dict[str, str] = provider_registry.key_map(Modality.LLM)
"""Mapping ``provider_name -> api_key_name`` for LLM providers."""

LLM_PRIORITY: list[str] = provider_registry.priority_list(Modality.LLM)
"""Ordered fallback list for LLM providers."""


# ---------------------------------------------------------------------------
# Public function (signature unchanged)
# ---------------------------------------------------------------------------


def generate_text(
    prompt: str,
    provider: str | None,
    options: TextOptions | CodeOptions | dict[str, Any],
    api_keys: dict[str, str],
    system_prompt: str | None = None,
) -> AgentResult:
    """
    Generate text using the best available LLM provider.

    Resolution is handled by the central :class:`ProviderRegistry`:
    *provider* is used if available; otherwise the priority list is
    walked until a provider with a valid API key is found.

    Args:
        prompt: User prompt.
        provider: Optional preferred provider name.
        options: Generation options (model, temperature, max_tokens ...).
        api_keys: Currently loaded API keys.
        system_prompt: Optional system message.

    Returns:
        :class:`AgentResult` with the generated text in ``content``.

    Raises:
        ProviderNotSupportedError: If *provider* is unknown.
        ProviderNotAvailableError: If no provider has a valid key.
        RuntimeError: If the selected provider has no adapter.

    Example:
        >>> # With an explicit provider
        >>> result = generate_text(
        ...     "Hello", "openai",
        ...     {"model": "gpt-4o-mini"},
        ...     {"openai_api_key": "sk-xxx"},
        ... )  # doctest: +SKIP
    """
    selected = provider_registry.resolve(Modality.LLM, api_keys, preferred=provider)

    opts = options if isinstance(options, dict) else options.model_dump()

    adapter = LLM_ADAPTERS.get(selected)
    if adapter is None:
        raise RuntimeError(f"No LLM adapter registered for provider: {selected}")

    key_name = provider_registry.get(selected).api_key_name
    api_key = api_keys.get(key_name, "")

    return adapter.invoke(prompt, opts, api_key, system_prompt)
