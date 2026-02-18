"""
UnityAgent -- orchestrates Unity Editor actions via Semantic Kernel + MCP.

Provider initialisation is now driven by the central
:pydata:`provider_registry` so that adding a new OpenAI-compatible
provider only requires a registry entry and (optionally) a ``base_url``.
"""

import logging
from typing import Any

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior

from ..services.providers import provider_registry
from .unity_mcp_plugin import UnityMCPPluginWrapper

LOGGER = logging.getLogger(__name__)


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
        if "model" not in options:
            raise ValueError("Model must be specified in options for UnityAgent.")

        kernel = Kernel()
        service_id = "default"

        caps = provider_registry.get(provider)
        api_key = api_keys.get(caps.api_key_name, "")

        # Resolve Azure endpoint for create_chat_service if needed
        endpoint = api_keys.get("AZURE_OPENAI_ENDPOINT") if provider == "azure" else None
        if provider == "azure":
             api_key = api_keys.get("AZURE_OPENAI_KEY", "")

        sk_service: ChatCompletionClientBase = provider_registry.create_chat_service(
            provider,
            api_key,
            model_id=options.get("model"),
            endpoint=endpoint,
            service_id=service_id
        )
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
