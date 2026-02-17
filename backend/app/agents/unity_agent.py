"""
UnityAgent -- orchestrates Unity Editor actions via Semantic Kernel + MCP.

Provider initialisation is now driven by the central
:pydata:`provider_registry` so that adding a new OpenAI-compatible
provider only requires a registry entry and (optionally) a ``base_url``.
"""

import logging
from typing import Any

from openai import AsyncOpenAI
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, OpenAIChatCompletion
from semantic_kernel.connectors.ai.google import GoogleAIChatCompletion
from semantic_kernel.connectors.ai.anthropic import AnthropicChatCompletion

from ..services.providers import Modality, ProviderNotSupportedError, provider_registry

from .unity_mcp_plugin import UnityMCPPluginWrapper

LOGGER = logging.getLogger(__name__)


def _build_sk_service(
    provider: str,
    options: dict[str, Any],
    api_keys: dict[str, str],
    service_id: str = "default",
) -> AzureChatCompletion | OpenAIChatCompletion:
    """
    Create a Semantic Kernel chat-completion service for *provider*.

    The function uses the provider registry to resolve the API key and
    ``base_url``.  Azure is handled as a special case because it needs
    a deployment name + endpoint rather than a base URL.

    Args:
        provider: Canonical provider name (e.g. ``"openai"``, ``"groq"``).
        options: Must contain ``"model"`` at minimum.
        api_keys: Loaded API key dictionary.
        service_id: SK service id (default ``"default"``).

    Returns:
        An SK chat-completion service instance ready to be added to a Kernel.

    Raises:
        ValueError: If ``options["model"]`` is missing.
        NotImplementedError: If the provider is not OpenAI-compatible and has
                             no native SK connector available.

    Example:
        >>> svc = _build_sk_service(
        ...     "openai",
        ...     {"model": "gpt-4o-mini"},
        ...     {"openai_api_key": "sk-xxx"},
        ... )  # doctest: +SKIP
    """
    if "model" not in options:
        raise ValueError("Model must be specified in options for UnityAgent.")

    caps = provider_registry.get(provider)
    api_key = api_keys.get(caps.api_key_name, "")

    # Azure special case
    if provider == "azure":
        return AzureChatCompletion(
            service_id=service_id,
            deployment_name=options["model"],
            endpoint=api_keys.get("AZURE_OPENAI_ENDPOINT", ""),
            api_key=api_keys.get("AZURE_OPENAI_KEY", ""),
        )

    # Google special case
    if provider == "google":
        return GoogleAIChatCompletion(
            service_id=service_id,
            ai_model_id=options["model"],
            api_key=api_key,
        )

    # Anthropic special case
    if provider == "anthropic":
        return AnthropicChatCompletion(
            service_id=service_id,
            ai_model_id=options["model"],
            api_key=api_key,
        )

    if caps.openai_compatible:
        if caps.base_url:
            client = AsyncOpenAI(api_key=api_key, base_url=caps.base_url)
            return OpenAIChatCompletion(
                service_id=service_id,
                ai_model_id=options["model"],
                async_client=client,
            )
        return OpenAIChatCompletion(
            service_id=service_id,
            ai_model_id=options["model"],
            api_key=api_key,
        )

    # If we reached here, and it's not OpenAI compatible nor handled above
    raise NotImplementedError(
        f"Provider '{provider}' is not currently handled in UnityAgent SK factory. "
        "Please use OpenAI, Azure, DeepSeek, OpenRouter, Groq, Google, or Anthropic."
    )


class UnityAgent:
    """
    Agent responsible for orchestrating Unity Editor actions via MCP.

    Uses Semantic Kernel's auto-function calling to execute Unity tools.
    Provider configuration is resolved through the central provider registry.
    """

    def __init__(self) -> None:
        pass

    async def run(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_keys: dict[str, str],
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        """
        Execute a Unity automation task based on the user prompt.

        Args:
            prompt: Natural-language instruction for Unity automation.
            provider: LLM provider to use (must be specified).
            options: Must contain at least ``"model"``.  May also include
                     ``temperature`` and ``max_tokens``.
            api_keys: Currently loaded API keys.
            system_prompt: Optional override for the system message.

        Returns:
            Dictionary with ``content``, ``files``, and ``metadata`` keys.

        Raises:
            ValueError: If *provider* or *options.model* is missing.
            NotImplementedError: If the provider lacks an SK connector.

        Example:
            >>> agent = UnityAgent()
            >>> result = await agent.run(
            ...     "Create a cube in the scene",
            ...     "openai",
            ...     {"model": "gpt-4o-mini"},
            ...     {"openai_api_key": "sk-xxx"},
            ... )  # doctest: +SKIP
        """
        if not provider:
            raise ValueError("Provider must be specified for UnityAgent.")

        kernel = Kernel()
        service_id = "default"

        sk_service = _build_sk_service(provider, options, api_keys, service_id)
        kernel.add_service(sk_service)

        # Initialize Unity MCP Plugin
        unity_plugin_wrapper = UnityMCPPluginWrapper()
        try:
            plugin_instance = await unity_plugin_wrapper.initialize()
        except Exception as exc:
            LOGGER.error("Unity MCP Server not reachable: %s", exc)
            return {
                "content": "Unity Editor is not connected. Please ensure the Unity MCP Server is running.",
                "error": str(exc),
            }
        kernel.add_plugin(plugin_instance, plugin_name="UnityMCP")

        try:
            kernel.get_service(service_id)

            from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings

            execution_settings = OpenAIChatPromptExecutionSettings(
                function_choice_behavior=FunctionChoiceBehavior.Auto(),
                temperature=options.get("temperature", 0.7),
                max_tokens=options.get("max_tokens", 2000),
            )

            system_message = (
                system_prompt
                or "You are a Unity Editor assistant. Use your tools to help the user with Unity tasks."
            )
            full_prompt = f"{system_message}\n\nUser: {prompt}"

            result = await kernel.invoke_prompt(prompt=full_prompt, settings=execution_settings)

            return {
                "content": str(result),
                "files": [],
                "metadata": {"steps": []},
            }
        except Exception as exc:
            LOGGER.error("UnityAgent failed: %s", exc)
            return {
                "content": f"Failed to execute Unity task: {exc}",
                "error": str(exc),
            }
        finally:
            await unity_plugin_wrapper.close()
