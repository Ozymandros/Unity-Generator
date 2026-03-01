"""
UnityAgent -- orchestrates Unity Editor actions via Semantic Kernel + MCP.

Provider initialisation is now driven by the central
:pydata:`provider_registry` so that adding a new OpenAI-compatible
provider only requires a registry entry and (optionally) a ``base_url``.
"""

import logging
import re
from typing import Any, TYPE_CHECKING
if TYPE_CHECKING:
    from semantic_kernel.connectors.ai.prompt_execution_settings import PromptExecutionSettings

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior

from ..services.providers import provider_registry
from ..services.providers.capabilities import Modality, ProviderCapabilities
from .unity_mcp_plugin import create_unity_mcp_plugin

LOGGER = logging.getLogger(__name__)

# Generic/unhelpful phrases that should be replaced with code-based or extracted messages
_GENERIC_ERROR_PHRASES = (
    "Error occurred while invoking function",
    "service failed to complete the prompt",
    "Something went wrong in function invocation",
)

# HTTP status -> user-facing generic message when we have no better text
_STATUS_MESSAGES = {
    401: "Authentication failed. Check your API key and provider settings.",
    402: "Insufficient balance or payment required. Top up your provider account.",
    403: "Access forbidden. Check your API key and account permissions.",
    429: "Rate limit exceeded. Try again in a moment.",
    500: "Provider server error. Try again later.",
    502: "Provider temporarily unavailable. Try again later.",
    503: "Provider overloaded. Try again later.",
}

# Substrings that indicate a useful API error message we can show as-is (or shorten)
_USEFUL_ERROR_PATTERNS = (
    "Insufficient Balance",
    "insufficient balance",
    "Authentication",
    "Invalid API key",
    "rate limit",
    "quota",
    "Payment required",
    "payment required",
)


def _normalize_agent_error(exc: BaseException) -> str:
    """
    Derive a user-facing error message from an exception.
    Prefer useful API messages or status-based generics; avoid generic SK wrapper text.
    """
    err_text = str(exc)
    status_code: int | None = None
    # Walk cause chain for APIStatusError or similar (openai package)
    cause = exc
    while cause is not None:
        sc = getattr(cause, "status_code", None)
        if sc is not None:
            status_code = int(sc)
        if status_code is None:
            resp = getattr(cause, "response", None)
            if resp is not None:
                sc = getattr(resp, "status_code", None)
                if sc is not None:
                    status_code = int(sc)
        cause = getattr(cause, "__cause__", None) or getattr(cause, "__context__", None)

    # Try to infer status from error text (e.g. "Error code: 402")
    if status_code is None:
        code_match = re.search(r"Error code:\s*(\d{3})", err_text, re.IGNORECASE)
        if code_match:
            status_code = int(code_match.group(1))

    if status_code is not None and status_code in _STATUS_MESSAGES:
        return _STATUS_MESSAGES[status_code]
    if status_code is not None:
        if 400 <= status_code < 500:
            return f"Request failed (HTTP {status_code}). Check your API key and request."
        if status_code >= 500:
            return f"Provider error (HTTP {status_code}). Try again later."

    # Only then treat as generic tool/SK failure
    if any(phrase in err_text for phrase in _GENERIC_ERROR_PHRASES):
        return (
            "LLM request failed. Try again, use a different model, or ensure "
            "the Unity MCP server (unity-mcp) is running if you use tools."
        )
    # Unknown but specific: show up to first line or a sensible length
    first_line = err_text.split("\n")[0].strip()
    if len(first_line) > 200:
        first_line = first_line[:197] + "..."
    return first_line or "An unexpected error occurred."


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
        api_key = api_keys.get(caps.api_key_name, "") if caps.api_key_name else ""
        use_tools = caps.supports_tool_use

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

        system_message = (
            system_prompt
            or "You are a Unity Editor assistant. Use your tools to help the user with Unity tasks."
        )
        full_prompt = f"{system_message}\n\nUser: {prompt}"

        try:
            # Common settings setup
            execution_settings = sk_service.instantiate_prompt_execution_settings(
                service_id=service_id,
                temperature=options.get("temperature", 0.7),
                max_tokens=options.get("max_tokens", 2000)
            )

            # Ensure model ID is explicitly set if the settings object supports it
            if hasattr(execution_settings, "ai_model_id"):
                model_id = options.get("model") or caps.default_models.get(Modality.LLM)
                setattr(execution_settings, "ai_model_id", model_id)

            if use_tools:
                # Provider supports tool use — register MCP plugin
                async with create_unity_mcp_plugin() as mcp_plugin:
                    kernel.add_plugin(mcp_plugin, plugin_name="UnityMCP")

                    # Set behavior for tool calling
                    if hasattr(execution_settings, "function_choice_behavior"):
                        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()

                    result = await kernel.invoke_prompt(prompt=full_prompt, settings=execution_settings)
            else:
                # Provider does NOT support tool use — run as plain LLM
                LOGGER.warning(
                    "Provider '%s' does not support tool use; "
                    "MCP plugin skipped.",
                    provider,
                )
                result = await kernel.invoke_prompt(prompt=full_prompt, settings=execution_settings)

            return {
                "content": str(result),
                "files": [],
                "metadata": {"steps": []},
            }

        except Exception as exc:
            LOGGER.error("UnityAgent failed: %s", exc)
            err_msg = str(exc)
            # Normalize known schema validation errors into a user-friendly message
            if "KernelParameterMetadata" in err_msg and ("string_type" in err_msg or "['string', 'null']" in err_msg):
                err_msg = (
                    "Unity MCP tool schema is incompatible with this backend version: "
                    "a tool parameter type was invalid. Try updating the Unity MCP server (unity-mcp) "
                    "or the backend semantic-kernel package."
                )
            else:
                err_msg = _normalize_agent_error(exc)
            return {
                "content": f"Failed to execute Unity task: {err_msg}",
                "error": err_msg,
            }

