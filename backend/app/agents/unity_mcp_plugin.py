"""Unity MCP plugin helpers for Semantic Kernel registration and live checks."""

from __future__ import annotations

import asyncio
import inspect
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Any

from semantic_kernel import Kernel
from unity_mcp import UnityMCPPlugin, UnityMcpOptions

from ..core.mcp_config import get_mcp_stdio_config, parse_mcp_args
from .modality_mcp_tool_policy import (
    allowed_namespace_plugins,
    filter_tool_names,
    normalize_modality_key,
)
from .unity_tool_argument_injection import inject_unity_tool_arguments

LOGGER = logging.getLogger("unity_mcp_plugin")
_ENV_MCP_COMMAND = "UNITY_MCP_COMMAND"
_ENV_MCP_ARGS = "UNITY_MCP_ARGS"
_DEFAULT_MCP_EXECUTABLE = "unity-mcp"
_LIVE_CHECK_TTL_SECONDS = 30.0
_live_check_cache: tuple[float, bool] | None = None


def _build_unity_mcp_options(command: str, raw_args: str) -> UnityMcpOptions:
    """
    Build UnityMcpOptions while forwarding UNITY_MCP_ARGS when supported.

    Args:
        command: MCP executable path or name. Must be a non-empty string.
        raw_args: Raw CLI argument string (quoted tokens allowed).

    Returns:
        Configured ``UnityMcpOptions`` instance.

    Raises:
        ValueError: If command is empty.

    Example:
        >>> opts = _build_unity_mcp_options("unity-mcp", '--project "C:/My Game"')
        >>> opts.executable_path
        'unity-mcp'
    """
    if not isinstance(command, str) or not command.strip():
        raise ValueError("command must be a non-empty string")

    option_kwargs: dict[str, Any] = {
        "executable_path": command.strip(),
        "connection_timeout_seconds": 30,
        "request_timeout_seconds": 30,
        "enable_message_logging": False,
    }
    args_list = parse_mcp_args(raw_args)
    if args_list:
        signature = inspect.signature(UnityMcpOptions)
        for candidate in ("args", "arguments", "executable_args", "server_args"):
            if candidate in signature.parameters:
                option_kwargs[candidate] = args_list
                break
        else:
            LOGGER.warning(
                "%s is set but the installed unity-mcp-plugin UnityMcpOptions type does not expose an args field.",
                _ENV_MCP_ARGS,
            )
    return UnityMcpOptions(**option_kwargs)


class InjectingUnityMcpPlugin:
    """
    Wrap a Unity MCP plugin to inject projectPath/fileName and track tool usage.

    Attributes:
        tools_called: True after any ``invoke_tool`` call in the current session.
    """

    def __init__(self, inner: Any, *, project_path: str | None = None) -> None:
        if inner is None:
            raise ValueError("inner plugin is required")
        self._inner = inner
        self._project_path = project_path
        self.tools_called = False

    def __getattr__(self, name: str) -> Any:
        return getattr(self._inner, name)

    async def invoke_tool(self, tool_name: str, arguments: dict[str, Any] | None = None) -> Any:
        """
        Invoke an MCP tool with injected Unity path arguments.

        Args:
            tool_name: MCP tool name.
            arguments: Tool arguments from the model or caller.

        Returns:
            Raw tool result from the inner plugin.
        """
        if not isinstance(tool_name, str) or not tool_name.strip():
            raise ValueError("tool_name must be a non-empty string")
        args = inject_unity_tool_arguments(
            tool_name.strip(),
            arguments if isinstance(arguments, dict) else {},
            project_path=self._project_path,
        )
        self.tools_called = True
        return await self._inner.invoke_tool(tool_name, args)


def register_unity_mcp_on_kernel(
    kernel: Kernel,
    plugin: Any,
    *,
    modality_key: str | None = None,
) -> None:
    """
    Register typed Unity MCP skills plus the discovery/router fallback.

    Args:
        kernel: Target Semantic Kernel. Must not be None.
        plugin: Initialized ``UnityMCPPlugin``. Must not be None.
        modality_key: Optional panel modality used to narrow registered tools.

    Raises:
        ValueError: If kernel or plugin is None.

    Example:
        >>> register_unity_mcp_on_kernel(kernel, plugin, modality_key="unity-lighting")
    """
    if kernel is None:
        raise ValueError("kernel is required")
    if plugin is None:
        raise ValueError("plugin is required")

    modality = normalize_modality_key(modality_key)
    allowed_namespaces = allowed_namespace_plugins(modality)

    typed_ok = False
    try:
        if allowed_namespaces is None:
            from unity_mcp import add_unity_mcp_skills

            add_unity_mcp_skills(kernel, plugin)
        else:
            from unity_mcp.skills import _SKILL_FACTORIES

            for namespace, factory in _SKILL_FACTORIES:
                if namespace in allowed_namespaces:
                    kernel.add_plugin(factory(plugin), plugin_name=namespace)
        typed_ok = True
        LOGGER.info(
            "Registered typed Unity MCP skills on the kernel (modality=%s).",
            modality or "all",
        )
    except Exception as exc:
        LOGGER.warning("Typed Unity MCP skills unavailable (%s); using discovery fallback.", exc)

    try:
        from unity_mcp import UNITY_MCP_TYPED_TOOL_NAMES, register_unity_tools_as_functions

        skip = set(UNITY_MCP_TYPED_TOOL_NAMES) if typed_ok else None
        if typed_ok and modality and modality != "wizard":
            allowed = filter_tool_names(modality, set(UNITY_MCP_TYPED_TOOL_NAMES))
            skip = set(UNITY_MCP_TYPED_TOOL_NAMES) - allowed
        register_unity_tools_as_functions(
            kernel=kernel,
            plugin=plugin,
            plugin_name="UnityMCPDiscovered",
            skip_tool_names=skip,
        )
    except Exception as discovery_exc:
        LOGGER.warning("Unity MCP discovery fallback failed: %s", discovery_exc)

    kernel.add_plugin(plugin, plugin_name="UnityMCP")


async def fetch_runtime_capabilities_guidance(plugin: Any) -> str:
    """
    Load ``unity_get_capabilities`` and format runtime guidance for the agent.

    Args:
        plugin: Initialized Unity MCP plugin. Must not be None.

    Returns:
        Compact guidance string. Never empty.

    Example:
        >>> text = await fetch_runtime_capabilities_guidance(plugin)
        >>> "unity_get_capabilities" in text
        True
    """
    if plugin is None:
        raise ValueError("plugin is required")

    fallback = (
        "\nRUNTIME CAPABILITIES:\n"
        "- Call unity_get_capabilities before Editor-gated tools "
        "(unity_validate_import, unity_component_*, unity_scene_reparent_gameobject, "
        "unity_camera_create/update, unity_light_create/update, unity_physics_create_body/"
        "update_body, unity_search_packages).\n"
        "- File-only UI/physics tools are compatibility-surrogates, not native Editor assets.\n"
    )
    try:
        raw = await plugin.invoke_tool("unity_get_capabilities", {})
        from unity_mcp import parse_unity_capability_manifest

        manifest = parse_unity_capability_manifest(raw if isinstance(raw, (dict, str)) else str(raw))
        backend = manifest.server.backend
        editor = "available" if manifest.server.editor_available else "unavailable"
        families = ", ".join(
            f"{cap.name}={cap.status}" for cap in manifest.capabilities[:12]
        ) or "none advertised"
        notes = "; ".join(manifest.notes[:4])
        extra = f" Notes: {notes}" if notes else ""
        return (
            f"\nRUNTIME CAPABILITIES (from unity_get_capabilities):\n"
            f"- backend: {backend}; Unity Editor is {editor}.\n"
            f"- families: {families}.{extra}\n"
            "- Call unity_get_capabilities before Editor-gated tools "
            "(unity_validate_import, unity_component_*, unity_scene_reparent_gameobject, "
            "native camera/light/physics create/update, unity_search_packages).\n"
            "- File-only UI/physics remain compatibility-surrogates unless status is native-editor.\n"
        )
    except Exception as exc:
        LOGGER.debug("Could not load unity_get_capabilities: %s", exc)
        return fallback


def _extract_media_base64(media_import: dict[str, Any]) -> str | None:
    """Return raw base64 from a media_import payload, stripping data-URI prefixes."""
    if not isinstance(media_import, dict):
        return None
    raw = media_import.get("base64") or media_import.get("data") or media_import.get("content")
    if not isinstance(raw, str) or not raw.strip():
        return None
    stripped = raw.strip()
    if stripped.lower().startswith("data:") and "," in stripped:
        return stripped.split(",", 1)[1]
    return stripped


async def persist_media_import(
    plugin: Any,
    project_path: str,
    media_import: dict[str, Any],
) -> str | None:
    """
    Persist a frontend media_import payload via ``unity_save_texture`` or ``unity_save_audio``.

    Args:
        plugin: Initialized Unity MCP plugin.
        project_path: Absolute Unity project root. Must be non-empty.
        media_import: Payload with ``name``, ``type``, and base64 ``data``.

    Returns:
        Tool result string on success, otherwise None.

    Raises:
        ValueError: If plugin is None or project_path is empty.

    Example:
        >>> await persist_media_import(plugin, "/proj", {"name": "a.png", "type": "image", "data": "..."})
    """
    if plugin is None:
        raise ValueError("plugin is required")
    if not isinstance(project_path, str) or not project_path.strip():
        raise ValueError("project_path must be a non-empty string")
    if not isinstance(media_import, dict):
        raise TypeError("media_import must be a dictionary")

    base64_data = _extract_media_base64(media_import)
    if not base64_data:
        LOGGER.warning("media_import has no base64 payload; skipping unity_save_*.")
        return None

    media_type = str(media_import.get("type") or "")
    name = str(media_import.get("name") or "imported_media")
    is_audio = media_type.startswith("audio")
    tool_name = "unity_save_audio" if is_audio else "unity_save_texture"
    folder = "Assets/Audio" if is_audio else "Assets/Textures"
    file_name = name if "/" in name or "\\" in name else f"{folder}/{name}"
    try:
        result = await plugin.invoke_tool(
            tool_name,
            {
                "projectPath": project_path.strip(),
                "fileName": file_name,
                "base64Data": base64_data,
            },
        )
        LOGGER.info("Persisted media_import via %s as %s", tool_name, file_name)
        return str(result)
    except Exception as exc:
        LOGGER.error("Failed to persist media_import via %s: %s", tool_name, exc)
        return None


def _mcp_save_tool_for_asset_type(asset_type: str) -> tuple[str, str]:
    mapping = {
        "code": ("unity_save_script", "content"),
        "text": ("unity_save_text", "content"),
        "image": ("unity_save_texture", "base64Data"),
        "audio": ("unity_save_audio", "base64Data"),
    }
    if asset_type not in mapping:
        raise ValueError(f"Unsupported asset_type for MCP save: {asset_type}")
    return mapping[asset_type]


async def _save_asset_via_mcp_async(
    project_path: str,
    asset_type: str,
    file_name: str,
    content: str,
) -> str | None:
    tool_name, payload_key = _mcp_save_tool_for_asset_type(asset_type)
    async with create_unity_mcp_plugin() as plugin:
        await plugin.invoke_tool(
            tool_name,
            {"projectPath": project_path, "fileName": file_name, payload_key: content},
        )
    return file_name


def save_asset_via_mcp(
    project_path: str,
    asset_type: str,
    file_name: str,
    content: str,
) -> str | None:
    """
    Save an asset through Unity MCP ``unity_save_*`` tools.

    Args:
        project_path: Unity project root. Must be non-empty.
        asset_type: One of ``code``, ``text``, ``image``, ``audio``.
        file_name: Project-relative file name (e.g. ``Assets/Scripts/Foo.cs``).
        content: Text content or raw base64 for binary assets.

    Returns:
        ``file_name`` on success, otherwise None.

    Example:
        >>> save_asset_via_mcp("/proj", "code", "Assets/Scripts/A.cs", "class A {}")
        'Assets/Scripts/A.cs'
    """
    if not isinstance(project_path, str) or not project_path.strip():
        raise ValueError("project_path must be a non-empty string")
    if not isinstance(file_name, str) or not file_name.strip():
        raise ValueError("file_name must be a non-empty string")
    if not isinstance(content, str) or not content:
        raise ValueError("content must be a non-empty string")
    try:
        return asyncio.run(
            _save_asset_via_mcp_async(project_path.strip(), asset_type, file_name.strip(), content)
        )
    except Exception as exc:
        LOGGER.warning("MCP asset save failed for %s (%s): %s", file_name, asset_type, exc)
        return None


async def _check_unity_mcp_live() -> bool:
    """
    Verify a live connection to the Unity MCP server (e.g. via ping).

    Returns:
        True only when the server is reachable and responds.
    """
    try:
        async with create_unity_mcp_plugin() as mcp_plugin:
            if hasattr(mcp_plugin, "invoke_tool"):
                try:
                    await mcp_plugin.invoke_tool("ping", {})
                    return True
                except Exception as ping_exc:
                    LOGGER.debug("Unity MCP ping via invoke_tool failed: %s", ping_exc)
            if hasattr(mcp_plugin, "is_healthy"):
                return bool(mcp_plugin.is_healthy())
            LOGGER.debug("Unity MCP live check could not find a ping tool or is_healthy probe.")
            return False
    except Exception as exc:
        LOGGER.debug("Unity MCP live check failed: %s", exc)
        return False


def unity_mcp_plugin_available_for_writing() -> bool:
    """
    Return True only when a live connection to the Unity MCP server can be established.

    Cached briefly so generation modalities do not spawn a new MCP process each time.
    """
    global _live_check_cache
    now = time.monotonic()
    if _live_check_cache is not None and (now - _live_check_cache[0]) < _LIVE_CHECK_TTL_SECONDS:
        return _live_check_cache[1]
    try:
        result = asyncio.run(_check_unity_mcp_live())
    except Exception as exc:
        LOGGER.debug("Unity MCP availability check failed: %s", exc)
        result = False
    _live_check_cache = (now, result)
    return result


def clear_unity_mcp_live_cache() -> None:
    """Clear the cached live-check result (used by tests)."""
    global _live_check_cache
    _live_check_cache = None


def get_unity_tool_names() -> list[str]:
    """
    Return typed Unity MCP tool names from the installed plugin package.

    Returns:
        Sorted list of tool names, or empty list when the plugin is unavailable.

    Example:
        >>> names = get_unity_tool_names()
        >>> "ping" in names
        True
    """
    try:
        from unity_mcp import UNITY_MCP_TYPED_TOOL_NAMES

        return sorted(UNITY_MCP_TYPED_TOOL_NAMES)
    except Exception as exc:
        LOGGER.debug("Could not load UNITY_MCP_TYPED_TOOL_NAMES: %s", exc)
        return []


def get_unity_mcp_status() -> dict[str, Any]:
    """
    Return a compact MCP status payload for the frontend.

    Uses the same capability probe as finalize, with fallbacks for MCP 3.2.0.
    """
    from ..services.unity_mcp_client import _probe_server_capabilities, mcp_configured

    if not mcp_configured():
        return {
            "available": False,
            "editor_available": False,
            "backend": "unknown",
            "error": "Unity MCP is not configured (unity-mcp not on PATH?)",
            "editor_gated_warning": "Unity MCP server is not reachable.",
        }

    try:
        caps = _probe_server_capabilities(15.0)
        server = caps.get("server") if isinstance(caps.get("server"), dict) else {}
        editor_available = bool(
            server.get("editorAvailable") or server.get("editor_available")
        )
        notes = caps.get("notes") if isinstance(caps.get("notes"), list) else []
        return {
            "available": True,
            "editor_available": editor_available,
            "backend": server.get("backend", "file"),
            "version": server.get("version"),
            "notes": notes,
            "editor_gated_warning": (
                None
                if editor_available
                else "Unity Editor is unavailable. Editor-gated tools "
                "(unity_validate_import, component/graph natives, package search) will fail or no-op."
            ),
        }
    except Exception as exc:
        LOGGER.debug("Unity MCP status probe failed: %s", exc)
        return {
            "available": False,
            "editor_available": False,
            "backend": "unknown",
            "error": str(exc),
            "editor_gated_warning": "Unity MCP server is not reachable.",
        }


async def get_unity_mcp_status_async() -> dict[str, Any]:
    """Async wrapper retained for callers; probe is synchronous via stdio spawn."""
    return get_unity_mcp_status()


@asynccontextmanager
async def create_unity_mcp_plugin():
    """
    Async context manager for the Unity MCP plugin.

    Uses the local `unity-mcp-plugin` package implementation and initializes
    the plugin against the configured Unity MCP executable.

    Use with: async with create_unity_mcp_plugin() as mcp_plugin: ...
    """
    LOGGER.info("Creating UnityMCP plugin...")
    command, _args = get_mcp_stdio_config()
    mcp_args = os.environ.get(_ENV_MCP_ARGS, "").strip()

    plugin = None
    try:
        options = _build_unity_mcp_options(command, mcp_args)
        plugin = UnityMCPPlugin.create(options)
        await plugin.initialize()
        LOGGER.info("UnityMCP plugin created successfully.")
        try:
            yield plugin
        finally:
            cleanup_plugin = plugin
            plugin = None
            await cleanup_plugin.cleanup()
    except Exception as exc:
        if plugin is not None:
            try:
                await plugin.cleanup()
            except Exception as cleanup_error:  # pragma: no cover - best-effort cleanup path
                LOGGER.debug("UnityMCP plugin cleanup after failed startup failed: %s", cleanup_error)
        LOGGER.error("Failed to create UnityMCP plugin: %s", exc)
        raise
