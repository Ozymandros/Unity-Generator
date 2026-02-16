import logging
from typing import Any

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, OpenAIChatCompletion

from .unity_mcp_plugin import UnityMCPPlugin

LOGGER = logging.getLogger(__name__)


class UnityAgent:
    """
    Agent responsible for orchestrating Unity Editor actions via MCP.
    Uses Semantic Kernel's auto-function calling to execute Unity tools.
    """

    def __init__(self):
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
        Executes a Unity automation task based on the user prompt.
        """
        kernel = Kernel()

        # Configure LLM Service
        service_id = "default"

        if provider == "azure":
            kernel.add_service(
                AzureChatCompletion(
                    service_id=service_id,
                    deployment_name=options.get("model", "gpt-4"),
                    endpoint=api_keys.get("AZURE_OPENAI_ENDPOINT", ""),
                    api_key=api_keys.get("AZURE_OPENAI_KEY", ""),
                )
            )
        else:
            kernel.add_service(
                OpenAIChatCompletion(
                    service_id=service_id,
                    ai_model_id=options.get("model", "gpt-4"),
                    api_key=api_keys.get("OPENAI_API_KEY", ""),
                )
            )

        # Import Unity MCP Plugin
        unity_plugin = UnityMCPPlugin(host="localhost", port=8765)

        # Pre-flight check
        try:
            await unity_plugin.client.ping()
        except Exception as e:
            LOGGER.error(f"Unity MCP Server not reachable: {e}")
            return {
                "content": "Unity Editor is not connected. Please ensure the Unity MCP Server is running.",
                "error": str(e),
            }

        kernel.add_plugin(unity_plugin, plugin_name="UnityMCP")

        try:
            # In SK 1.x, we use FunctionChoiceBehavior to enable auto-calling
            kernel.get_service(service_id)

            # Setup the execution settings with auto function calling
            # We use OpenAIChatPromptExecutionSettings or similar depending on provider,
            # but usually we can pass it to invoke.
            from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings

            execution_settings = OpenAIChatPromptExecutionSettings(
                function_choice_behavior=FunctionChoiceBehavior.Auto(),
                temperature=options.get("temperature", 0.7),
                max_tokens=options.get("max_tokens", 2000),
            )

            # Use the kernel to invoke the chat completion with tools enabled
            # We can use a simple prompt or a more elaborate chat history
            system_message = (
                system_prompt or "You are a Unity Editor assistant. Use your tools to help the user with Unity tasks."
            )
            full_prompt = f"{system_message}\n\nUser: {prompt}"

            result = await kernel.invoke_prompt(prompt=full_prompt, settings=execution_settings)

            return {
                "content": str(result),
                "files": [],
                "metadata": {
                    "steps": []  # Tracking steps is more complex in 1.x invoke, skipping for now
                },
            }
        except Exception as e:
            LOGGER.error(f"UnityAgent failed: {e}")
            return {"content": f"Failed to execute Unity task: {str(e)}", "error": str(e)}
