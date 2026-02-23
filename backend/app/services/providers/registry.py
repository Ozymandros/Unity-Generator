"""
Central provider registry -- single source of truth.

Every known provider is registered here with its capabilities, API key
name, supported modalities, default models, and fallback priority per
modality.  The rest of the codebase resolves providers through
:pydata:`provider_registry` instead of maintaining per-file maps.
"""

from __future__ import annotations

import logging
from collections.abc import Iterable
from typing import Any, TYPE_CHECKING
if TYPE_CHECKING:
    from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion


from .connectors.elevenlabs import ElevenLabsTextToAudio
from .connectors.google_custom import GoogleTextToAudio, GoogleTextToImage
from .connectors.stability import StabilityTextToImage

from .capabilities import Modality, ProviderCapabilities
from .errors import ProviderNotAvailableError, ProviderNotSupportedError

LOGGER = logging.getLogger(__name__)


class ProviderRegistry:
    """
    Thread-safe, in-memory registry of all known AI providers.

    Attributes:
        _providers: Mapping of provider name -> capabilities.
        _priorities: Mapping of modality -> ordered list of provider names.

    Example:
        >>> registry = ProviderRegistry()
        >>> registry.register(ProviderCapabilities(
        ...     name="demo", api_key_name="demo_key",
        ...     modalities={Modality.LLM},
        ...     default_models={Modality.LLM: "demo-model"},
        ... ))
        >>> registry.get("demo").name
        'demo'
    """

    def __init__(self) -> None:
        """
        Initialise an empty registry with priority lists for every modality.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.priority_list(Modality.LLM)
            []
        """
        self._providers: dict[str, ProviderCapabilities] = {}
        self._priorities: dict[Modality, list[str]] = {m: [] for m in Modality}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(
        self,
        capabilities: ProviderCapabilities,
        *,
        priorities: dict[Modality, int] | None = None,
    ) -> None:
        """
        Register a provider with its capabilities.

        Args:
            capabilities: Full capability descriptor for the provider.
            priorities: Optional explicit priority index per modality
                        (lower = higher priority).  When omitted the
                        provider is appended at the end of each modality
                        list it supports.

        Raises:
            ValueError: If *capabilities.name* is empty.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key",
            ...     modalities={Modality.LLM, Modality.IMAGE},
            ...     default_models={Modality.LLM: "gpt-4o-mini"},
            ... ))
        """
        if not capabilities.name:
            raise ValueError("Provider name cannot be empty")

        name = capabilities.name.lower()
        self._providers[name] = capabilities

        for modality in capabilities.modalities:
            prio_list = self._priorities[modality]
            if name in prio_list:
                prio_list.remove(name)
            if priorities and modality in priorities:
                prio_list.insert(priorities[modality], name)
            else:
                prio_list.append(name)

        LOGGER.debug("Registered provider '%s' for %s", name, capabilities.modalities)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get(self, name: str) -> ProviderCapabilities:
        """
        Return capabilities for *name*.

        Args:
            name: Canonical provider name (case-insensitive).

        Returns:
            The :class:`ProviderCapabilities` instance.

        Raises:
            ProviderNotSupportedError: If *name* is not registered.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key"))
            >>> reg.get("openai").api_key_name
            'openai_api_key'
        """
        name = name.lower()
        if name not in self._providers:
            raise ProviderNotSupportedError(
                f"Provider '{name}' is not registered",
                provider=name,
            )
        return self._providers[name]

    def supports(self, name: str, modality: Modality) -> bool:
        """
        Check whether *name* supports *modality*.

        Args:
            name: Provider name.
            modality: The modality to check.

        Returns:
            ``True`` if the provider is registered and supports the modality.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key",
            ...     modalities={Modality.LLM}))
            >>> reg.supports("openai", Modality.LLM)
            True
            >>> reg.supports("openai", Modality.VIDEO)
            False
        """
        try:
            caps = self.get(name)
        except ProviderNotSupportedError:
            return False
        return modality in caps.modalities

    def priority_list(self, modality: Modality) -> list[str]:
        """
        Return the ordered fallback list for *modality*.

        Args:
            modality: The target modality.

        Returns:
            List of provider names in priority order (highest first).

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key",
            ...     modalities={Modality.LLM}))
            >>> reg.priority_list(Modality.LLM)
            ['openai']
        """
        return list(self._priorities.get(modality, []))

    def key_map(self, modality: Modality) -> dict[str, str]:
        """
        Build a ``{provider_name: api_key_name}`` map for *modality*.

        This produces the same shape used by the legacy
        ``LLM_KEY_MAP`` / ``IMAGE_KEY_MAP`` / ``AUDIO_KEY_MAP`` constants
        so callers can migrate incrementally.

        Args:
            modality: Target modality.

        Returns:
            Dictionary mapping provider name to its api_key_name.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key",
            ...     modalities={Modality.LLM}))
            >>> reg.key_map(Modality.LLM)
            {'openai': 'openai_api_key'}
        """
        result: dict[str, str] = {}
        for name in self._priorities.get(modality, []):
            caps = self._providers[name]
            if caps.api_key_name:
                result[name] = caps.api_key_name
        return result

    # ------------------------------------------------------------------
    # Resolution (replaces select_provider)
    # ------------------------------------------------------------------

    def resolve(
        self,
        modality: Modality,
        api_keys: dict[str, str],
        preferred: str | None = None,
    ) -> str:
        """
        Select the best available provider for *modality*.

        Resolution order:
        1. *preferred* if it is registered, supports the modality, and has
           a valid API key.
        2. Walk the modality priority list and return the first provider
           whose API key is present and non-empty.
        3. Raise :class:`ProviderNotAvailableError` if nothing matches.

        Args:
            modality: Target modality.
            api_keys: Dictionary of currently loaded API keys.
            preferred: Optional preferred provider name.

        Returns:
            Canonical provider name that should be used.

        Raises:
            ProviderNotSupportedError: If *preferred* is given but unknown.
            ProviderNotAvailableError: If no provider has a valid key.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="openai", api_key_name="openai_api_key",
            ...     modalities={Modality.LLM}))
            >>> reg.resolve(Modality.LLM, {"openai_api_key": "sk-xxx"})
            'openai'
        """
        if preferred:
            preferred_lower = preferred.lower()
            caps = self.get(preferred_lower)  # raises if unknown
            if modality not in caps.modalities:
                raise ProviderNotSupportedError(
                    f"Provider '{preferred_lower}' does not support modality '{modality.value}'",
                    provider=preferred_lower,
                    modality=modality.value,
                )
            print(f"[RESOLVE] Checking preferred: {preferred_lower}")
            key_name = caps.api_key_name
            api_key = api_keys.get(key_name) if key_name else None
            if (key_name and api_key) or not caps.requires_api_key:
                print(f"[RESOLVE] Success! Returning {preferred_lower} (Key required={caps.requires_api_key})")
                return preferred_lower

            print(f"[RESOLVE] Preferred {preferred_lower} has no key ({key_name}). Falling back to priority list.")

        for name in self._priorities.get(modality, []):
            caps = self._providers[name]
            if modality not in caps.modalities:
                continue
            key_name = caps.api_key_name
            if key_name and api_keys.get(key_name):
                return name

        raise ProviderNotAvailableError(
            f"No valid API key found for any '{modality.value}' provider.",
            modality=modality.value,
        )

    # ------------------------------------------------------------------
    # SK Service Factories
    # ------------------------------------------------------------------

    def create_chat_service(
        self,
        provider: str,
        api_key: str,
        model_id: str | None = None,
        **kwargs: Any
    ) -> Any:
        """
        Create a Semantic Kernel ChatCompletion service for the given provider.
        """
        from openai import AsyncOpenAI
        from semantic_kernel.connectors.ai.anthropic import AnthropicChatCompletion
        from semantic_kernel.connectors.ai.google import GoogleAIChatCompletion
        from semantic_kernel.connectors.ai.open_ai import (
            OpenAIChatCompletion,
            AzureChatCompletion,
        )
        from .connectors.replicate import (
            ReplicateTextToImage,
            ReplicateTextToAudio,
        )
        print(f"\n[REGISTRY] create_chat_service: provider={provider}, model_id={model_id}", flush=True)
        caps = self.get(provider)
        target_model = model_id or caps.default_models[Modality.LLM]
        print(f"[REGISTRY] Using target_model: {target_model}", flush=True)

        if caps.openai_compatible:
            # Handle Hugging Face dynamic base URL for OpenAI compatibility
            if provider == "huggingface":
                base_url = "https://router.huggingface.co/v1"
                api_key = api_key or "sk-dummy" # Ensure valid key for client
            else:
                base_url = caps.base_url

            client = AsyncOpenAI(api_key=api_key, base_url=base_url)
            return OpenAIChatCompletion(
                ai_model_id=target_model,
                async_client=client,
                service_id=kwargs.get("service_id", provider)
            )

        if provider == "openai":
            return OpenAIChatCompletion(
                ai_model_id=target_model,
                api_key=api_key,
                service_id=kwargs.get("service_id", provider)
            )

        if provider == "azure":
            return AzureChatCompletion(
                deployment_name=target_model,
                api_key=api_key,
                endpoint=kwargs.get("endpoint"),
                service_id=kwargs.get("service_id", "default"),
            )

        if provider == "google":
            return GoogleAIChatCompletion(
                gemini_model_id=target_model,
                api_key=api_key,
                service_id=kwargs.get("service_id", provider),
            )

        if provider == "anthropic":
            return AnthropicChatCompletion(
                ai_model_id=target_model,
                api_key=api_key,
                service_id=kwargs.get("service_id", provider),
            )

        if provider == "huggingface":
            # If it's not marked as openai_compatible, use native HF connector
            from semantic_kernel.connectors.ai.hugging_face import HuggingFaceTextCompletion
            # Ensure we pass the api_key if needed
            import os
            if api_key:
                os.environ["HUGGING_FACE_HUB_TOKEN"] = api_key
            else:
                # Optionally pop it if it was set to something stale
                os.environ.pop("HUGGING_FACE_HUB_TOKEN", None)
            return HuggingFaceTextCompletion(
                ai_model_id=target_model,
                task="text-generation"
            )

        raise NotImplementedError(f"SK Chat service for '{provider}' not yet implemented.")

    def create_text_to_image_service(self, provider: str, api_key: str, model_id: str | None = None) -> Any:
        """
        Create a Semantic Kernel TextToImage service.
        """
        from semantic_kernel.connectors.ai.open_ai import OpenAITextToImage
        caps = self.get(provider)
        target_model = model_id or caps.default_models[Modality.IMAGE]

        if provider == "openai":
            return OpenAITextToImage(
                api_key=api_key,
                ai_model_id=target_model
            )

        if provider == "replicate":
            from .connectors.replicate import ReplicateTextToImage
            return ReplicateTextToImage(api_key=api_key, model_id=target_model)

        if provider == "stability":
            return StabilityTextToImage(api_key=api_key, model_id=target_model)

        if provider == "google":
            return GoogleTextToImage(api_key=api_key, model_id=target_model)

        raise NotImplementedError(f"SK Image service for '{provider}' not yet implemented.")

    def create_text_to_audio_service(self, provider: str, api_key: str, model_id: str | None = None) -> Any:
        """
        Create a Semantic Kernel TextToAudio service.
        """
        from semantic_kernel.connectors.ai.open_ai import OpenAITextToAudio
        caps = self.get(provider)
        target_model = model_id or caps.default_models[Modality.AUDIO]

        if provider == "openai":
             return OpenAITextToAudio(
                api_key=api_key,
                ai_model_id=target_model
            )

        if provider == "replicate":
            from .connectors.replicate import ReplicateTextToAudio
            return ReplicateTextToAudio(api_key=api_key, model_id=target_model)

        if provider == "elevenlabs":
            return ElevenLabsTextToAudio(api_key=api_key, model_id=target_model)

        if provider == "google":
            return GoogleTextToAudio(api_key=api_key, model_id=target_model)

        raise NotImplementedError(f"SK Audio service for '{provider}' not yet implemented.")

    # ------------------------------------------------------------------
    # In-memory Lifecycle
    # ------------------------------------------------------------------

    def load_from_db(self) -> None:
        """
        Refresh the registry from the database.
        """
        from ...repositories import get_provider_repo
        repo = get_provider_repo()
        providers = repo.get_all()

        # Reset internal state
        self._providers = {}
        self._priorities = {m: [] for m in Modality}

        # Register each provider from DB
        for caps in providers:
            self.register(caps)

        LOGGER.info("Registry loaded %d providers from database", len(providers))

    def all_providers(self) -> Iterable[ProviderCapabilities]:
        """
        Iterate over every registered provider.

        Returns:
            Iterable of :class:`ProviderCapabilities`.

        Example:
            >>> reg = ProviderRegistry()
            >>> reg.register(ProviderCapabilities(
            ...     name="demo", api_key_name="demo_key"))
            >>> [p.name for p in reg.all_providers()]
            ['demo']
        """
        return self._providers.values()


# ======================================================================
# Module-level singleton with all known providers pre-registered.
# ======================================================================

def _build_default_registry() -> ProviderRegistry:
    """
    Construct and return the default registry with every known provider.

    NOTE: This is retained for seeding purposes and backward compatibility.
    """
    reg = ProviderRegistry()

    # ---- LLM providers (in priority order) ----
    reg.register(
        ProviderCapabilities(
            name="google",
            api_key_name="google_api_key",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO},
            default_models={
                Modality.LLM: "gemini-1.5-flash",
                Modality.IMAGE: "imagen-3.0-generate-002",
                Modality.AUDIO: "google-tts",
            },
            supports_vision=True,
            supports_streaming=True,
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=False,
        ),
        priorities={Modality.LLM: 0, Modality.IMAGE: 2, Modality.AUDIO: 2},
    )

    reg.register(
        ProviderCapabilities(
            name="anthropic",
            api_key_name="anthropic_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "claude-3-5-sonnet-20240620"},
            supports_vision=True,
            supports_streaming=True,
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=False,
        ),
        priorities={Modality.LLM: 1},
    )

    reg.register(
        ProviderCapabilities(
            name="deepseek",
            api_key_name="deepseek_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "deepseek-chat"},
            base_url="https://api.deepseek.com",
            supports_function_calling=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        priorities={Modality.LLM: 2},
    )

    reg.register(
        ProviderCapabilities(
            name="openrouter",
            api_key_name="openrouter_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "openrouter/auto"},
            base_url="https://openrouter.ai/api/v1",
            supports_function_calling=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        priorities={Modality.LLM: 3},
    )

    reg.register(
        ProviderCapabilities(
            name="openai",
            api_key_name="openai_api_key",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO},
            default_models={
                Modality.LLM: "gpt-4o",
                Modality.IMAGE: "dall-e-3",
                Modality.AUDIO: "tts-1",
            },
            extra={"is_tts": True},
            supports_function_calling=True,
            supports_vision=True,
            supports_json_mode=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        priorities={Modality.LLM: 4, Modality.IMAGE: 1, Modality.AUDIO: 1},
    )

    reg.register(
        ProviderCapabilities(
            name="groq",
            api_key_name="groq_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "llama-3.1-8b-instant"},
            base_url="https://api.groq.com/openai/v1",
            supports_function_calling=True,
            supports_streaming=True,
            supports_tool_use=True,
            openai_compatible=True,
        ),
        priorities={Modality.LLM: 5},
    )

    reg.register(
        ProviderCapabilities(
            name="huggingface",
            api_key_name="huggingface_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "google/gemma-2b"},
            base_url="https://router.huggingface.co/v1",
            supports_function_calling=False,
            supports_streaming=True,
            openai_compatible=True,
            requires_api_key=False,
        ),
        priorities={Modality.LLM: 6},
    )

    reg.register(
        ProviderCapabilities(
            name="ollama",
            api_key_name="ollama_api_key",
            modalities={Modality.LLM},
            default_models={Modality.LLM: "qwen2.5-coder:latest"},
            base_url="http://localhost:11434/v1",
            supports_function_calling=False,
            supports_streaming=True,
            openai_compatible=True,
            requires_api_key=False,
        ),
        priorities={Modality.LLM: 7},
    )

    # ---- Image-only providers ----
    reg.register(
        ProviderCapabilities(
            name="stability",
            api_key_name="stability_api_key",
            modalities={Modality.IMAGE},
            default_models={Modality.IMAGE: "stable-diffusion-xl-1024-v1-0"},
            openai_compatible=False,
        ),
        priorities={Modality.IMAGE: 0},
    )

    reg.register(
        ProviderCapabilities(
            name="flux",
            api_key_name="flux_api_key",
            modalities={Modality.IMAGE},
            default_models={Modality.IMAGE: "flux-1.1-pro"},
            openai_compatible=False,
        ),
        priorities={Modality.IMAGE: 3},
    )

    # ---- Audio-only providers ----
    reg.register(
        ProviderCapabilities(
            name="elevenlabs",
            api_key_name="elevenlabs_api_key",
            modalities={Modality.AUDIO},
            default_models={Modality.AUDIO: "eleven_multilingual_v2"},
            openai_compatible=False,
            extra={"is_tts": True},
        ),
        priorities={Modality.AUDIO: 0},
    )

    reg.register(
        ProviderCapabilities(
            name="playht",
            api_key_name="playht_api_key",
            modalities={Modality.AUDIO},
            default_models={Modality.AUDIO: "playht-default"},
            openai_compatible=False,
            extra={"is_tts": True},
        ),
        priorities={Modality.AUDIO: 3},
    )

    reg.register(
        ProviderCapabilities(
            name="replicate",
            api_key_name="replicate_api_key",
            modalities={Modality.LLM, Modality.IMAGE, Modality.AUDIO, Modality.MUSIC},
            default_models={
                Modality.LLM: "google-deepmind/gemma-2b-it",
                Modality.IMAGE: "black-forest-labs/flux-schnell",
                Modality.AUDIO: "facebookresearch/musicgen",
                Modality.MUSIC: "facebookresearch/musicgen",
            },
            openai_compatible=True,
            base_url="https://api.replicate.com/v1",
            supports_function_calling=False,
            supports_streaming=True,
            supports_tool_use=False,
            extra={"is_music": True},
        ),
        priorities={Modality.MUSIC: 0}
    )

    # ---- Video providers (scaffolds) ----
    reg.register(
        ProviderCapabilities(
            name="runway",
            api_key_name="runway_api_key",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "gen-3-alpha"},
            openai_compatible=False,
        ),
        priorities={Modality.VIDEO: 0},
    )

    reg.register(
        ProviderCapabilities(
            name="pika",
            api_key_name="pika_api_key",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "pika-1.0"},
            openai_compatible=False,
        ),
        priorities={Modality.VIDEO: 1},
    )

    reg.register(
        ProviderCapabilities(
            name="luma",
            api_key_name="luma_api_key",
            modalities={Modality.VIDEO},
            default_models={Modality.VIDEO: "dream-machine"},
            openai_compatible=False,
        ),
        priorities={Modality.VIDEO: 2},
    )

    return reg


provider_registry: ProviderRegistry = ProviderRegistry()
# singleton initialization will happen via load_from_db during app startup
"""Module-level singleton used throughout the application."""
