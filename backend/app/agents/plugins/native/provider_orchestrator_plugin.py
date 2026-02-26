"""
ProviderOrchestratorPlugin - Native Plugin for provider management.

This plugin acts as a bridge between agents and AI providers,
managing provider selection according to priority and API key availability.
It now delegates to the central :pydata:`provider_registry` so there is
a single source of truth for key maps, priorities, and capabilities.
"""

import logging
from typing import Any

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    def kernel_function(func=None, name=None, description=None):
        if func is not None and callable(func):
            return func
        def decorator(f):
            return f
        return decorator


from ....repositories import get_api_key_repo
from ....services.providers import Modality, ProviderError, provider_registry

LOGGER = logging.getLogger(__name__)

_MODALITY_ALIAS: dict[str, Modality] = {
    "llm": Modality.LLM,
    "image": Modality.IMAGE,
    "audio": Modality.AUDIO,
    "video": Modality.VIDEO,
    "music": Modality.MUSIC,
}


class ProviderOrchestratorPlugin:
    """
    Native plugin for orchestrating AI provider selection.

    Manages provider selection according to defined priority and API key
    availability, and normalizes responses to the GenerationResponse format.
    All provider metadata is resolved through the central
    :pydata:`provider_registry`.
    """

    @kernel_function(
        name="get_best_provider",
        description="Checks config/api_keys.json and selects the provider with available key according to priority",
    )
    def get_best_provider(
        self, provider_type: str, preferred_provider: str | None = None
    ) -> str:
        """
        Select the best available provider according to priority and API keys.

        Args:
            provider_type: Provider type (``"llm"``, ``"image"``, ``"audio"``, or ``"video"``).
            preferred_provider: Optional preferred provider. If available, it is used.

        Returns:
            Name of the selected provider.

        Raises:
            ValueError: If provider_type is invalid.
            ProviderError: If no provider is available.

        Example:
            >>> plugin = ProviderOrchestratorPlugin()
            >>> provider = plugin.get_best_provider("llm")
            >>> provider in provider_registry.priority_list(Modality.LLM)
            True
        """
        if not provider_type:
            raise ValueError("provider_type cannot be empty")

        modality = _MODALITY_ALIAS.get(provider_type.lower())
        if modality is None:
            raise ValueError(
                f"Invalid provider_type: {provider_type}. "
                f"Must be one of {list(_MODALITY_ALIAS.keys())}"
            )

        api_keys = get_api_key_repo().get_all()

        try:
            selected = provider_registry.resolve(
                modality, api_keys, preferred=preferred_provider,
            )
            LOGGER.info("Selected %s provider: %s", modality.value, selected)
            return selected
        except ProviderError as exc:
            LOGGER.error("No provider available for %s: %s", modality.value, exc)
            raise

    @kernel_function(
        name="validate_response",
        description="Normalizes responses from different APIs to the GenerationResponse format",
    )
    def validate_response(
        self, provider: str, raw_response: dict[str, Any], provider_type: str
    ) -> dict[str, Any]:
        """
        Normalize a provider response to the standard GenerationResponse format.

        Args:
            provider: Name of the provider used.
            raw_response: Raw response from the provider.
            provider_type: Provider type (``"llm"``, ``"image"``, or ``"audio"``).

        Returns:
            Normalized dictionary with GenerationResponse format.

        Example:
            >>> plugin = ProviderOrchestratorPlugin()
            >>> response = {"content": "Hello", "model": "gpt-4"}
            >>> normalized = plugin.validate_response("openai", response, "llm")
            >>> normalized["provider"]
            'openai'
        """
        if not provider:
            raise ValueError("provider cannot be empty")

        if not raw_response:
            raise ValueError("raw_response cannot be empty")

        normalized: dict[str, Any] = {"provider": provider}

        if provider_type == "llm":
            normalized["content"] = raw_response.get("content", "")
            normalized["model"] = raw_response.get("model", "")
        elif provider_type == "image":
            normalized["url"] = raw_response.get("url", "")
            normalized["base64"] = raw_response.get("base64", "")
        elif provider_type == "audio":
            normalized["url"] = raw_response.get("url", "")
            normalized["base64"] = raw_response.get("base64", "")
        else:
            normalized.update(raw_response)

        LOGGER.debug("Normalized %s response from %s", provider_type, provider)
        return normalized

