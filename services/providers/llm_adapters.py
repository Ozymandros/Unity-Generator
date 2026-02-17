"""
Concrete LLM adapter implementations.

Each class wraps the HTTP call to a specific provider and returns a
normalised :class:`AgentResult`.  The adapters are deliberately thin --
they mirror the original ``_call_*`` helpers in ``services/llm_provider.py``
but conform to the :class:`BaseProviderAdapter` contract.
"""

from __future__ import annotations

import logging
from typing import Any

import requests
from app.schemas import AgentResult

from .adapters import BaseProviderAdapter
from .capabilities import Modality

LOGGER = logging.getLogger(__name__)


# ------------------------------------------------------------------
# OpenAI-compatible base (shared by OpenAI, DeepSeek, OpenRouter, Groq)
# ------------------------------------------------------------------


class OpenAICompatibleLLMAdapter(BaseProviderAdapter):
    """
    Adapter for any provider that implements the OpenAI
    ``/v1/chat/completions`` contract.

    Args:
        provider_name: Canonical provider name.
        endpoint: Full URL for the chat completions endpoint.
        default_model: Model id to use when none is specified.

    Example:
        >>> adapter = OpenAICompatibleLLMAdapter(
        ...     provider_name="openai",
        ...     endpoint="https://api.openai.com/v1/chat/completions",
        ...     default_model="gpt-4o-mini",
        ... )
        >>> adapter.provider_name
        'openai'
    """

    def __init__(
        self,
        provider_name: str,
        endpoint: str,
        default_model: str,
    ) -> None:
        super().__init__(Modality.LLM, provider_name)
        self._endpoint = endpoint
        self._default_model = default_model

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Send a chat completion request to an OpenAI-compatible endpoint.

        Args:
            prompt: User message content.
            options: Must support ``model``, ``temperature``, ``max_tokens``.
            api_key: Bearer token for the endpoint.
            system_prompt: Optional system message prepended to the chat.

        Returns:
            :class:`AgentResult` with the assistant's reply in ``content``.

        Raises:
            requests.HTTPError: On non-2xx response from the provider.
        """
        model = self.get_opt(options, "model", self._default_model)
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": self.get_opt(options, "temperature", 0.7),
            "max_tokens": self.get_opt(options, "max_tokens", 2048),
        }
        headers = {"Authorization": f"Bearer {api_key}"}
        response = requests.post(
            self._endpoint, json=payload, headers=headers, timeout=60,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return AgentResult(content=content, provider=self.provider_name, model=model)


# ------------------------------------------------------------------
# Concrete provider instances
# ------------------------------------------------------------------


class OpenAILLMAdapter(OpenAICompatibleLLMAdapter):
    """OpenAI GPT adapter."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="openai",
            endpoint="https://api.openai.com/v1/chat/completions",
            default_model="gpt-4o-mini",
        )


class DeepSeekLLMAdapter(OpenAICompatibleLLMAdapter):
    """DeepSeek adapter (OpenAI-compatible)."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="deepseek",
            endpoint="https://api.deepseek.com/v1/chat/completions",
            default_model="deepseek-chat",
        )


class OpenRouterLLMAdapter(OpenAICompatibleLLMAdapter):
    """OpenRouter adapter (OpenAI-compatible proxy)."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="openrouter",
            endpoint="https://openrouter.ai/api/v1/chat/completions",
            default_model="openrouter/auto",
        )


class GroqLLMAdapter(OpenAICompatibleLLMAdapter):
    """Groq adapter (OpenAI-compatible)."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="groq",
            endpoint="https://api.groq.com/openai/v1/chat/completions",
            default_model="llama-3.1-8b-instant",
        )


# ------------------------------------------------------------------
# Non-OpenAI providers (stubs, ready for real implementation)
# ------------------------------------------------------------------


class GoogleLLMAdapter(BaseProviderAdapter):
    """
    Google Gemini adapter.

    Currently returns a stub response.  Replace ``_do_invoke`` with
    a real Gemini SDK call when ready.
    """

    def __init__(self) -> None:
        super().__init__(Modality.LLM, "google")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Return a stub response for Google Gemini.

        Args:
            prompt: User prompt text.
            options: Generation options; ``model`` defaults to ``gemini-1.5-flash``.
            api_key: Google API key (unused in stub).
            system_prompt: Optional system message (unused in stub).

        Returns:
            :class:`AgentResult` with a stub content string.
        """
        model = self.get_opt(options, "model", "gemini-1.5-flash")
        return AgentResult(
            content=f"[Google {model} stub] Prompt: {prompt}",
            provider="google",
            model=model,
        )


class AnthropicLLMAdapter(BaseProviderAdapter):
    """
    Anthropic Claude adapter.

    Currently returns a stub response.  Replace ``_do_invoke`` with
    a real Anthropic SDK call when ready.
    """

    def __init__(self) -> None:
        super().__init__(Modality.LLM, "anthropic")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Return a stub response for Anthropic Claude.

        Args:
            prompt: User prompt text.
            options: Generation options; ``model`` defaults to ``claude-3-5-sonnet-20240620``.
            api_key: Anthropic API key (unused in stub).
            system_prompt: Optional system message (unused in stub).

        Returns:
            :class:`AgentResult` with a stub content string.
        """
        model = self.get_opt(options, "model", "claude-3-5-sonnet-20240620")
        return AgentResult(
            content=f"[Anthropic {model} stub] Prompt: {prompt}",
            provider="anthropic",
            model=model,
        )


# ======================================================================
# Adapter lookup table -- used by the refactored service layer
# ======================================================================

LLM_ADAPTERS: dict[str, BaseProviderAdapter] = {
    "openai": OpenAILLMAdapter(),
    "deepseek": DeepSeekLLMAdapter(),
    "openrouter": OpenRouterLLMAdapter(),
    "groq": GroqLLMAdapter(),
    "google": GoogleLLMAdapter(),
    "anthropic": AnthropicLLMAdapter(),
}
