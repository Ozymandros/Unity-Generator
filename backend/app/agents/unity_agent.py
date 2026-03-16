"""
UnityAgent -- orchestrates Unity Editor actions via Semantic Kernel + MCP.

Provider initialisation is now driven by the central
:pydata:`provider_registry` so that adding a new OpenAI-compatible
provider only requires a registry entry and (optionally) a ``base_url``.
"""

import logging
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior

from ..services.providers import provider_registry
from ..services.providers.capabilities import Modality
from .unity_mcp_plugin import create_unity_mcp_plugin, unity_mcp_plugin_available_for_writing

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

    Walks the full exception cause chain to find an HTTP status code, then maps
    it to a friendly message.  Falls back to stripping generic Semantic Kernel
    wrapper text so the user sees something actionable rather than an internal
    framework error.

    Args:
        exc: The exception to normalise.  May be any ``BaseException`` subclass,
             including chained exceptions with ``__cause__`` or ``__context__``.

    Returns:
        A concise, user-facing string describing the error.  Never empty.

    Example:
        >>> from openai import AuthenticationError
        >>> err = AuthenticationError("Invalid API key", response=None, body=None)
        >>> _normalize_agent_error(err)
        'Authentication failed. Check your API key and provider settings.'
    """
    err_text = str(exc)
    status_code: int | None = None

    # Walk the full cause chain so we can find an HTTP status code even when
    # the original API error is wrapped by Semantic Kernel or another layer.
    cause = exc
    while cause is not None:
        sc = getattr(cause, "status_code", None)
        if sc is not None:
            status_code = int(sc)
        if status_code is None:
            # Some HTTP client libraries attach the response object rather than
            # exposing status_code directly on the exception.
            resp = getattr(cause, "response", None)
            if resp is not None:
                sc = getattr(resp, "status_code", None)
                if sc is not None:
                    status_code = int(sc)
        cause = getattr(cause, "__cause__", None) or getattr(cause, "__context__", None)

    # Last resort: parse "Error code: NNN" from the stringified exception text
    if status_code is None:
        code_match = re.search(r"Error code:\s*(\d{3})", err_text, re.IGNORECASE)
        if code_match:
            status_code = int(code_match.group(1))

    # Map known HTTP status codes to friendly messages
    if status_code is not None and status_code in _STATUS_MESSAGES:
        return _STATUS_MESSAGES[status_code]
    if status_code is not None:
        if 400 <= status_code < 500:
            return f"Request failed (HTTP {status_code}). Check your API key and request."
        if status_code >= 500:
            return f"Provider error (HTTP {status_code}). Try again later."

    # Replace generic Semantic Kernel wrapper phrases with a more helpful message
    if any(phrase in err_text for phrase in _GENERIC_ERROR_PHRASES):
        return (
            "LLM request failed. Try again, use a different model, or ensure "
            "the Unity MCP server (unity-mcp) is running if you use tools."
        )

    # For all other errors, show the first line truncated to a readable length
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

    def _build_enhanced_capabilities_guidance(self) -> str:
        """
        Build comprehensive guidance for Unity-MCP-Server 3.0.5 tools.

        Returns:
            String containing all tool category guidance sections and workflow
            recommendations to help the LLM understand when and how to use
            Unity automation tools.

        Example:
            >>> agent = UnityAgent()
            >>> guidance = agent._build_enhanced_capabilities_guidance()
            >>> assert "SCENE BUILDING" in guidance
            >>> assert "unity_create_detailed_scene" in guidance
        """
        return """

You have access to Unity-MCP-Server 3.0.5 tools for advanced Unity automation:

SCENE BUILDING:
- unity_create_detailed_scene: Create scenes with multiple GameObjects in one call
- unity_add_gameobject: Add individual GameObjects (Cube, Sphere, Capsule, Light, Camera)
- unity_create_material: Create materials with shader properties
- unity_create_prefab: Create prefabs from GameObjects

UI CREATION:
- unity_create_ui_canvas: Create UI Canvas with elements (Panel, Button, Text, Image)
- unity_create_ui_layout: Create complex UI layouts

ANIMATION & CUTSCENES:
- unity_create_basic_animator: Create simple Animator Controllers with states and transitions
- unity_create_advanced_animator: Create complex animators with blend trees and parameters
- unity_create_timeline: Create Timeline assets for cutscenes and sequences

INPUT & INTERACTION:
- unity_create_input_actions: Create Input System action maps

PROTOTYPING:
- unity_create_prototype_recipe: Create complete game prototypes (FPS, ThirdPerson, TopDown, Platformer)
  This creates: scene, player, camera, input, UI, and scripts in one call

MEDIA IMPORT:
- unity_save_texture: Import images as Unity textures
- unity_save_audio: Import audio files as Unity audio clips

WORKFLOW RECOMMENDATIONS:
1. For animations: Create animator → Create prefab with Animator component → Attach to GameObject
2. For cutscenes: Create timeline → Add timeline component to GameObject → Configure tracks
3. For prototypes: Use unity_create_prototype_recipe for instant playable setup
4. Always validate with unity_validate_import after creating assets

When user requests animations, cutscenes, or prototypes, use these tools proactively.
"""

    async def run(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_keys: dict[str, str],
        system_prompt: str | None = None,
        project_path: str | None = None,
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
            project_path: Optional path to Unity project root. If provided, must exist.

        Returns:
            Dictionary with ``content``, ``files``, and ``metadata`` keys.

        Raises:
            ValueError: If *prompt* is empty, *provider* or *options.model* is missing,
                       or *project_path* does not exist.
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
        # Input validation: prompt must be non-empty string
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            error_msg = "prompt must be non-empty string"
            LOGGER.error("Input validation failed: %s", error_msg)
            raise ValueError(error_msg)

        # Input validation: project_path must exist if provided
        if project_path is not None:
            project_path_obj = Path(project_path)
            if not project_path_obj.exists():
                error_msg = f"project_path does not exist: {project_path}"
                LOGGER.error("Input validation failed: %s", error_msg)
                raise ValueError(error_msg)

        if not provider:
            raise ValueError("Provider must be specified for UnityAgent.")
        if "model" not in options:
            raise ValueError("Model must be specified in options for UnityAgent.")

        kernel = Kernel()
        service_id = "default"

        caps = provider_registry.get(provider)
        api_key = api_keys.get(caps.api_key_name, "") if caps.api_key_name else ""
        # Only register the MCP plugin when the provider's DB record allows tool use
        # AND the MCP server process is reachable — avoids hanging on unavailable servers.
        use_tools = caps.supports_tool_use and unity_mcp_plugin_available_for_writing()

        # Azure uses a separate endpoint URL and a different key name from other providers
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
        if project_path:
            # Normalize path for cross-platform consistency (converts Windows backslashes)
            normalized_path = Path(project_path).as_posix()
            system_message += (
                f" The Unity project root (projectPath) is: {normalized_path}. "
                "For every tool call that creates or modifies files (scenes, materials, game objects, scripts, assets), "
                "you must pass projectPath equal to this project root, and fileName "
                "(or folderName for folder/list tools) as the path under the project "
                "(e.g. Assets/Scenes/MyScene.unity). Never pass only a relative path; "
                "always include projectPath. Do not use the MCP server executable path "
                "or any NuGet/nupkg path. Do not ask the user for the path. "
                "Tool parameters: unity_create_scene(projectPath, fileName); "
                "unity_create_material(projectPath, fileName, materialJson); "
                "unity_add_gameobject(projectPath, fileName, gameObjectJson); "
                "unity_create_script(projectPath, fileName, scriptName, content?)."
            )
        if use_tools:
            # Explicitly instruct the LLM to call tools rather than just describing what it
            # would do — without this, some models default to a text-only response.
            system_message += (
                " You must try to use available tools to create or modify content "
                "in the project. Do not reply with only text. "
                "After any connectivity or project-info check, call the appropriate tools "
                "(e.g. unity_create_scene, unity_add_gameobject, unity_create_script, "
                "unity_create_material) to fulfill the user's request. "
                "Continue calling tools until the requested scene, objects, or scripts are created."
            )
        else:
            # Let the LLM know it is running in text-only mode so it doesn't attempt
            # to call tools that aren't registered.
            system_message += (
                " You do not have access to Unity tools; reply with plain text only."
            )

        # Append enhanced capabilities guidance for Unity-MCP-Server 3.0.5
        system_message += self._build_enhanced_capabilities_guidance()

        full_prompt = f"{system_message}\n\nUser: {prompt}"

        try:
            # Common settings setup
            execution_settings = sk_service.instantiate_prompt_execution_settings(
                service_id=service_id,
                temperature=options.get("temperature", 0.7),
                max_tokens=options.get("max_tokens", 2000)
            )

            # Some SK connectors expose ai_model_id as a settable attribute; set it
            # explicitly so the correct model is used even when the service was
            # constructed without a model_id (e.g. dynamic model selection).
            if hasattr(execution_settings, "ai_model_id"):
                model_id = options.get("model") or caps.default_models.get(Modality.LLM)
                execution_settings.ai_model_id = model_id  # type: ignore

            if use_tools:
                # Provider allows tool use and MCP is available — register plugin
                LOGGER.info(
                    "Provider '%s' allows tool use and Unity MCP is available; registering plugin.",
                    provider,
                )
                async with create_unity_mcp_plugin() as mcp_plugin:
                    kernel.add_plugin(mcp_plugin, plugin_name="UnityMCP")

                    # Auto function-choice lets the LLM decide when to call tools
                    # rather than requiring explicit tool names in the prompt.
                    if hasattr(execution_settings, "function_choice_behavior"):
                        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()

                    result = await kernel.invoke_prompt(prompt=full_prompt, settings=execution_settings)
            else:
                # Provider does not allow tool use or MCP not available — run as plain LLM
                LOGGER.debug(
                    "Provider '%s' tool use or MCP unavailable; running without Unity MCP plugin.",
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
            # The MCP plugin schema validator raises a specific error when a tool
            # parameter type is incompatible with the installed SK version.
            # Detect this pattern and replace it with an actionable upgrade hint.
            if "KernelParameterMetadata" in err_msg and ("string_type" in err_msg or "['string', 'null']" in err_msg):
                err_msg = (
                    "Unity MCP tool schema is incompatible with this backend version: "
                    "a tool parameter type was invalid. Try updating the Unity MCP server (unity-mcp) "
                    "or the backend semantic-kernel package."
                )
            else:
                # For all other errors, normalise to a user-friendly message
                err_msg = _normalize_agent_error(exc)
            return {
                "content": f"Failed to execute Unity task: {err_msg}",
                "error": err_msg,
            }


