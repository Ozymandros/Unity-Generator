"""
Provider adapter protocols and base classes.

Each modality defines a :class:`Protocol` that every concrete adapter must
satisfy.  A shared :class:`BaseProviderAdapter` provides common plumbing
(error translation, logging, option extraction).
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from collections.abc import Mapping
from typing import Any, Protocol, runtime_checkable

from app.schemas import AgentResult

from .capabilities import Modality, ProviderCapabilities
from .errors import ProviderError, ProviderTimeoutError

LOGGER = logging.getLogger(__name__)


# ======================================================================
# Protocols (structural sub-typing contracts)
# ======================================================================


@runtime_checkable
class LLMAdapter(Protocol):
    """
    Contract for any LLM text-generation adapter.

    Example:
        >>> class MyLLM:
        ...     modality = Modality.LLM
        ...     provider_name = "my_llm"
        ...     def invoke(self, prompt, options, api_key, system_prompt=None):
        ...         return AgentResult(content="ok", provider="my_llm")
        >>> isinstance(MyLLM(), LLMAdapter)
        True
    """

    modality: Modality
    provider_name: str

    def invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult: ...


@runtime_checkable
class ImageAdapter(Protocol):
    """
    Contract for any image-generation adapter.

    Example:
        >>> class MyImg:
        ...     modality = Modality.IMAGE
        ...     provider_name = "my_img"
        ...     def invoke(self, prompt, options, api_key, system_prompt=None):
        ...         return AgentResult(image="b64data", provider="my_img")
        >>> isinstance(MyImg(), ImageAdapter)
        True
    """

    modality: Modality
    provider_name: str

    def invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult: ...


@runtime_checkable
class AudioAdapter(Protocol):
    """
    Contract for any audio-generation (TTS) adapter.

    Example:
        >>> class MyAudio:
        ...     modality = Modality.AUDIO
        ...     provider_name = "my_audio"
        ...     def invoke(self, prompt, options, api_key, system_prompt=None):
        ...         return AgentResult(audio="b64data", provider="my_audio")
        >>> isinstance(MyAudio(), AudioAdapter)
        True
    """

    modality: Modality
    provider_name: str

    def invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult: ...


@runtime_checkable
class VideoAdapter(Protocol):
    """
    Contract for any video-generation adapter.

    Example:
        >>> class MyVideo:
        ...     modality = Modality.VIDEO
        ...     provider_name = "my_video"
        ...     def invoke(self, prompt, options, api_key, system_prompt=None):
        ...         return AgentResult(content="video_url", provider="my_video")
        >>> isinstance(MyVideo(), VideoAdapter)
        True
    """

    modality: Modality
    provider_name: str

    def invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult: ...


# ======================================================================
# Base class with shared plumbing
# ======================================================================


class BaseProviderAdapter(ABC):
    """
    Optional base class that concrete adapters can extend for shared
    logic (option extraction, error wrapping, logging).

    Sub-classes only need to implement :meth:`_do_invoke`.

    Attributes:
        modality: The modality this adapter serves.
        provider_name: Canonical provider name.
        capabilities: Reference to the provider's registered capabilities.

    Example:
        >>> # Subclass usage (pseudocode)
        >>> class OpenAILLMAdapter(BaseProviderAdapter):
        ...     def __init__(self):
        ...         super().__init__(Modality.LLM, "openai", None)
        ...     def _do_invoke(self, prompt, options, api_key, system_prompt=None):
        ...         return AgentResult(content="hello", provider="openai")
    """

    def __init__(
        self,
        modality: Modality,
        provider_name: str,
        capabilities: ProviderCapabilities | None = None,
    ) -> None:
        self.modality = modality
        self.provider_name = provider_name
        self.capabilities = capabilities

    # ------------------------------------------------------------------
    # Public entry-point
    # ------------------------------------------------------------------

    def invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Validate inputs, delegate to ``_do_invoke``, translate errors.

        Args:
            prompt: User prompt text.
            options: Provider/modality-specific options dict.
            api_key: The resolved API key for this provider.
            system_prompt: Optional system prompt override.

        Returns:
            Normalised :class:`AgentResult`.

        Raises:
            ProviderError: On any provider-level failure.
        """
        if not prompt:
            raise ProviderError(
                "Prompt cannot be empty",
                provider=self.provider_name,
                modality=self.modality.value,
            )

        if not api_key:
            raise ProviderError(
                "API key is required",
                provider=self.provider_name,
                modality=self.modality.value,
            )

        try:
            return self._do_invoke(prompt, options, api_key, system_prompt)
        except ProviderError:
            raise
        except TimeoutError as exc:
            raise ProviderTimeoutError(
                f"Request to {self.provider_name} timed out",
                provider=self.provider_name,
                modality=self.modality.value,
            ) from exc
        except Exception as exc:
            LOGGER.exception(
                "Unexpected error in %s adapter '%s'",
                self.modality.value,
                self.provider_name,
            )
            raise ProviderError(
                f"{self.provider_name} adapter error: {exc}",
                provider=self.provider_name,
                modality=self.modality.value,
            ) from exc

    # ------------------------------------------------------------------
    # Helpers available to sub-classes
    # ------------------------------------------------------------------

    from collections.abc import Mapping

    @staticmethod
    def get_opt(options: Mapping[str, object] | object, key: str, default: object) -> object:
        """
        Safely extract an option from a Mapping or object (including Pydantic models).

        Args:
            options: Options Mapping or object with attributes.
            key: Option key to retrieve.
            default: Fallback value.

        Returns:
            The option value or *default*.

        Example:
            >>> BaseProviderAdapter.get_opt({"temperature": 0.9}, "temperature", 0.7)
            0.9
            >>> class Obj: temperature = 0.9
            >>> BaseProviderAdapter.get_opt(Obj(), "temperature", 0.7)
            0.9
        """
        if isinstance(options, Mapping):
            return options.get(key, default)
        return getattr(options, key, default)

    # ------------------------------------------------------------------
    # Abstract
    # ------------------------------------------------------------------

    @abstractmethod
    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Perform the actual provider call.  Must be implemented by sub-classes.

        Args:
            prompt: User prompt.
            options: Generation options.
            api_key: Provider API key.
            system_prompt: Optional system prompt.

        Returns:
            :class:`AgentResult` with generation output.
        """
        ...
