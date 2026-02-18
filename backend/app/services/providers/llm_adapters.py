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
        return AgentResult(
            content=content,
            provider=self.provider_name,
            model=str(model) if model is not None else None,
        )


# ------------------------------------------------------------------
# Concrete provider instances
# ------------------------------------------------------------------


class OpenAILLMAdapter(BaseProviderAdapter):
    """OpenAI GPT adapter using v1/responses."""

    def __init__(self) -> None:
        super().__init__(Modality.LLM, "openai")
        self._endpoint = "https://api.openai.com/v1/responses"
        self._default_model = "gpt-4o"

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        model = self.get_opt(options, "model", self._default_model)
        
        # Build new "input" list
        input_items: list[dict[str, str]] = []
        if system_prompt:
            input_items.append({"role": "system", "content": system_prompt})
        input_items.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "input": input_items,
            # "text": {"format": "json"}  <- Only if we want JSON mode, but default is text.
        }

        # Handle optional params if supported by v1/responses
        # (Assuming tempearature/max_tokens are still top-level or need adjustment, 
        # but adhering to plan for now. Migration guide suggests minimal changes for simple cases,
        # but responses API is "agentic". For safe step, we send minimal payload first.)
        
        headers = {
            "Authorization": f"Bearer {api_key}",
        }
        response = requests.post(
            self._endpoint, json=payload, headers=headers, timeout=60,
        )
        response.raise_for_status()
        
        # New response parsing
        # response.json()["output"][0]["content"]
        data = response.json()
        try:
             content = data["output"][0]["content"]
        except (KeyError, IndexError):
             # Fallback or robust error handling
             LOGGER.error("Unexpected OpenAI response format: %s", data)
             raise
             
        return AgentResult(
            content=content,
            provider=self.provider_name,
            model=str(model),
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
        Send a request to Google's Gemini API (v1beta).

        Args:
            prompt: User message content.
            options: Supports ``model``, ``temperature``, ``max_tokens``.
            api_key: Google API key.
            system_prompt: Optional system instruction.

        Returns:
            :class:`AgentResult` with generated text.
        """
        model_id = self.get_opt(options, "model", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"

        contents: list[dict[str, Any]] = []
        if system_prompt:
            # Note: Gemini v1beta supports systemInstruction separately,
            # but for a simple adapter call we often prepend to the first message.
            # Real implementation would use system_instruction field if supported by the model variant.
            prompt = f"{system_prompt}\n\n{prompt}"

        contents.append({"parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": self.get_opt(options, "temperature", 0.7),
                "maxOutputTokens": self.get_opt(options, "max_tokens", 2048),
            },
        }

        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        try:
            content = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            LOGGER.error("Invalid response from Gemini: %s", data)
            raise ValueError(f"Failed to parse Gemini response: {exc}") from exc

        return AgentResult(content=content, provider="google", model=str(model_id))


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
            model=str(model) if model is not None else None,
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
