"""
ProviderOrchestratorPlugin - Native Plugin for provider management.

This plugin acts as a bridge between agents and AI providers,
managing provider selection according to priority and API key availability.
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


from backend.app.config import load_api_keys
from services.provider_select import select_provider

LOGGER = logging.getLogger(__name__)


class ProviderOrchestratorPlugin:
    """
    Native plugin for orchestrating AI provider selection.

    Manages provider selection according to defined priority and API key
    availability, and normalizes responses to the GenerationResponse format.
    """

    # Priority and key maps per provider type
    LLM_PRIORITY = ["deepseek", "openrouter", "openai", "groq"]
    LLM_KEY_MAP = {
        "deepseek": "deepseek_api_key",
        "openrouter": "openrouter_api_key",
        "openai": "openai_api_key",
        "groq": "groq_api_key",
    }

    IMAGE_PRIORITY = ["stability", "flux"]
    IMAGE_KEY_MAP = {
        "stability": "stability_api_key",
        "flux": "flux_api_key",
    }

    AUDIO_PRIORITY = ["elevenlabs", "playht"]
    AUDIO_KEY_MAP = {
        "elevenlabs": "elevenlabs_api_key",
        "playht": "playht_api_key",
    }

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
            provider_type: Provider type ("llm", "image", or "audio").
            preferred_provider: Optional preferred provider. If available, it is used.

        Returns:
            Name of the selected provider.

        Raises:
            ValueError: If provider_type is invalid.
            RuntimeError: If no provider is available.

        Example:
            >>> plugin = ProviderOrchestratorPlugin()
            >>> provider = plugin.get_best_provider("llm")
            >>> provider in ["deepseek", "openrouter", "openai", "groq"]
            True
        """
        if not provider_type:
            raise ValueError("provider_type cannot be empty")

        provider_type = provider_type.lower()
        api_keys = load_api_keys()

        # Select priority and key map according to type
        if provider_type == "llm":
            priority = self.LLM_PRIORITY
            key_map = self.LLM_KEY_MAP
        elif provider_type == "image":
            priority = self.IMAGE_PRIORITY
            key_map = self.IMAGE_KEY_MAP
        elif provider_type == "audio":
            priority = self.AUDIO_PRIORITY
            key_map = self.AUDIO_KEY_MAP
        else:
            raise ValueError(
                f"Invalid provider_type: {provider_type}. Must be 'llm', 'image', or 'audio'"
            )

        try:
            selected = select_provider(preferred_provider, api_keys, priority, key_map)
            LOGGER.info(f"Selected {provider_type} provider: {selected}")
            return selected
        except RuntimeError as e:
            LOGGER.error(f"No provider available for type {provider_type}: {e}")
            raise RuntimeError(
                f"No valid {provider_type} provider available. Please configure API keys."
            )

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
            provider_type: Provider type ("llm", "image", or "audio").

        Returns:
            Normalized dictionary with GenerationResponse format.

        Example:
            >>> plugin = ProviderOrchestratorPlugin()
            >>> response = {"content": "Hello", "model": "gpt-4"}
            >>> normalized = plugin.validate_response("openai", response, "llm")
            >>> "content" in normalized
            True
            >>> normalized["provider"] == "openai"
            True
        """
        if not provider:
            raise ValueError("provider cannot be empty")

        if not raw_response:
            raise ValueError("raw_response cannot be empty")

        # Normalize according to provider type
        normalized = {
            "provider": provider,
        }

        if provider_type == "llm":
            # Typical LLM response: {"content": "...", "model": "..."}
            normalized["content"] = raw_response.get("content", "")
            normalized["model"] = raw_response.get("model", "")
        elif provider_type == "image":
            # Image response: {"url": "...", "base64": "..."}
            normalized["url"] = raw_response.get("url", "")
            normalized["base64"] = raw_response.get("base64", "")
        elif provider_type == "audio":
            # Audio response: {"url": "...", "base64": "..."}
            normalized["url"] = raw_response.get("url", "")
            normalized["base64"] = raw_response.get("base64", "")
        else:
            # Generic response: copy all fields
            normalized.update(raw_response)

        LOGGER.debug(f"Normalized {provider_type} response from {provider}")
        return normalized
