"""
MCP-Unity plugin client for Unity automation.

When MCP is enabled (UNITY_USE_MCP=1) and a server is configured, calls the
Unity-MCP-Server contract tools via the MCP SDK (stdio or Streamable HTTP):
unity_install_packages, unity_create_default_scene, unity_configure_urp,
unity_validate_import. Normalizes JSON responses to the dict shape expected
by the orchestrator (success, message, installed, scene_path, prefab_path,
error_count, warning_count, errors, warnings).

When MCP is disabled or the SDK is unavailable, returns a placeholder response
so the app falls back to batch mode.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from collections.abc import Callable
from pathlib import Path
from typing import Any

from ..core.mcp_config import get_mcp_stdio_config
from .unity_orchestrator import SetupResult

LOGGER = logging.getLogger(__name__)

# Override for tests: when True, mcp_available() returns True even if env/SDK not set.
_MCP_AVAILABLE: bool = False

_ENV_USE_MCP = "UNITY_USE_MCP"
_ENV_SERVER_URL = "UNITY_MCP_SERVER_URL"
_ENV_COMMAND = "UNITY_MCP_COMMAND"
_ENV_ARGS = "UNITY_MCP_ARGS"

try:
    from mcp import ClientSession
    from mcp.client.stdio import StdioServerParameters, stdio_client
    from mcp.types import TextContent
except ImportError:
    ClientSession = None
    StdioServerParameters = None
    stdio_client = None
    TextContent = None

try:
    from mcp.shared.exceptions import McpError
except ImportError:
    McpError = Exception  # type: ignore[misc, assignment]

CAPABILITIES_TOOL_CANDIDATES = ("unity_get_capabilities", "unity_get_server_info")
LINT_TOOL_NAME = "unity_lint_project"

try:
    from mcp.client.streamable_http import streamable_http_client
except ImportError:
    streamable_http_client = None


def _is_unknown_tool_message(message: str) -> bool:
    """Return True when the MCP server does not expose the requested tool."""
    lowered = message.lower()
    return "unknown tool:" in lowered or "unknown tool '" in lowered


def _format_mcp_invoke_error(exc: BaseException) -> str:
    """
    Normalize MCP SDK errors (including TaskGroup wrappers) to a short message.

    Args:
        exc: Exception raised while invoking an MCP tool.

    Returns:
        Human-readable error string suitable for API responses.
    """
    if isinstance(exc, McpError):
        return str(exc)
    if isinstance(exc, BaseExceptionGroup):
        for inner in exc.exceptions:
            text = _format_mcp_invoke_error(inner)
            if text:
                return text
    return str(exc)


def _default_file_only_capabilities() -> dict[str, Any]:
    """Fallback capability payload when the server has no capabilities probe tool."""
    return {
        "success": True,
        "server": {
            "backend": "file",
            "editorAvailable": False,
            "editor_available": False,
        },
        "capabilities": [],
        "notes": ["Capabilities probe unavailable on this Unity MCP server version."],
    }


def _probe_server_capabilities(timeout_seconds: float | None) -> dict[str, Any]:
    """
    Load editor/backend capability info, with fallbacks for older MCP servers.

    Unity MCP Server 3.2.0 lacks ``unity_get_capabilities``; treat that as file-only.
    """
    for tool_name in CAPABILITIES_TOOL_CANDIDATES:
        caps = _call_tool(tool_name, {}, timeout_seconds=timeout_seconds)
        if isinstance(caps.get("server"), dict):
            return caps
        message = str(caps.get("message") or "")
        if _is_unknown_tool_message(message):
            LOGGER.debug("MCP capabilities tool %s unavailable: %s", tool_name, message)
            continue
        if caps.get("success"):
            return caps
        if message and not _is_unknown_tool_message(message):
            return caps
    return _default_file_only_capabilities()


def mcp_configured() -> bool:
    """
    Return True when the MCP Python SDK is present and a server command/URL is configured.

    Returns:
        True if stdio command or Streamable HTTP URL is available for MCP connections.

    Example:
        >>> mcp_configured()  # doctest: +SKIP
        True
    """
    if ClientSession is None:
        return False
    url = os.environ.get(_ENV_SERVER_URL, "").strip()
    cmd, _args = get_mcp_stdio_config()
    return bool(url or cmd)


def mcp_available() -> bool:
    """
    Return True when finalize ``auto`` mode should prefer the MCP backend.

    Explicit ``mcp`` mode uses ``mcp_configured()`` directly and does not require
    this flag. Set ``UNITY_USE_MCP=0`` to force batch-only automation.
    """
    if _MCP_AVAILABLE:
        return True
    raw = os.environ.get(_ENV_USE_MCP, "").strip().lower()
    if raw in ("0", "false", "no"):
        return False
    if raw in ("1", "true", "yes"):
        return mcp_configured()
    return False


def _placeholder_response(message: str = "MCP-Unity plugin is not configured") -> dict[str, Any]:
    return {"success": False, "message": message}


def _normalize_tool_response(text: str, tool_name: str) -> dict[str, Any]:
    """Parse server JSON and normalize to the dict shape the orchestrator expects."""
    out: dict[str, Any] = {"success": False, "message": None}
    try:
        data = json.loads(text) if isinstance(text, str) else text
    except (json.JSONDecodeError, TypeError):
        out["message"] = f"Invalid JSON from {tool_name}: {text[:200] if text else 'empty'}"
        return out

    if not isinstance(data, dict):
        out["message"] = f"Unexpected response type from {tool_name}"
        return out

    out["success"] = data.get("success", False)
    if "message" in data and data["message"] is not None:
        out["message"] = data["message"]
    if isinstance(data.get("data"), dict):
        out["data"] = data["data"]
    if isinstance(data.get("errors"), list):
        out["errors"] = data["errors"]
    if isinstance(data.get("warnings"), list):
        out["warnings"] = data["warnings"]
    if data.get("suggestedRemediation"):
        out["suggested_remediation"] = data["suggestedRemediation"]

    if "server" in data and "capabilities" in data:
        out["server"] = data.get("server")
        out["capabilities"] = data.get("capabilities")
        out["notes"] = data.get("notes") if isinstance(data.get("notes"), list) else []
        out["success"] = True

    if tool_name == "unity_install_packages":
        out["installed"] = data.get("installed") if isinstance(data.get("installed"), list) else []
    elif tool_name == "unity_create_default_scene":
        out["scene_path"] = data.get("scene_path")
        out["prefab_path"] = data.get("prefab_path")
    elif tool_name == "unity_validate_import":
        out["error_count"] = data.get("error_count", 0)
        out["warning_count"] = data.get("warning_count", 0)
        out["errors"] = data.get("errors") if isinstance(data.get("errors"), list) else []
        out["warnings"] = data.get("warnings") if isinstance(data.get("warnings"), list) else []
        if out.get("error_count") and not out.get("message"):
            out["message"] = f"Compilation had {out['error_count']} error(s)."
    else:
        if "path" in data:
            out["path"] = data.get("path")
        if "native_path" in data:
            out["native_path"] = data.get("native_path")

    return out


async def _call_tool_async(
    tool_name: str,
    arguments: dict[str, Any],
    timeout_seconds: float | None = None,
) -> dict[str, Any]:
    """Connect to MCP server, call tool, return normalized dict."""
    if not mcp_configured():
        return _placeholder_response()

    url = os.environ.get(_ENV_SERVER_URL, "").strip()
    cmd, args_list = get_mcp_stdio_config()

    async def do_call(session: Any) -> dict[str, Any]:
        try:
            if timeout_seconds is not None and timeout_seconds > 0:
                result = await asyncio.wait_for(
                    session.call_tool(tool_name, arguments),
                    timeout=timeout_seconds,
                )
            else:
                result = await session.call_tool(tool_name, arguments)
        except Exception as exc:
            message = _format_mcp_invoke_error(exc)
            if _is_unknown_tool_message(message):
                LOGGER.debug("MCP tool %s unavailable: %s", tool_name, message)
            else:
                LOGGER.warning("MCP tool %s failed: %s", tool_name, message)
            return {"success": False, "message": message}

        if getattr(result, "isError", False):
            err_text = ""
            for c in getattr(result, "content", []) or []:
                if TextContent is not None and isinstance(c, TextContent):
                    err_text = c.text
                    break
            return _normalize_tool_response(err_text or "Tool returned error", tool_name)

        text = ""
        for c in getattr(result, "content", []) or []:
            if TextContent is not None and isinstance(c, TextContent):
                text = c.text
                break
        return _normalize_tool_response(text or "{}", tool_name)

    try:
        if url:
            if streamable_http_client is None:
                return _placeholder_response(
                    "UNITY_MCP_SERVER_URL set but streamable HTTP not available (install mcp[cli])."
                )
            http_client = streamable_http_client
            async with http_client(url) as (read_stream, write_stream, _):
                if ClientSession is None:
                    return _placeholder_response("MCP SDK not available.")
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    return await do_call(session)
        else:
            if StdioServerParameters is None or stdio_client is None or ClientSession is None:
                return _placeholder_response("MCP SDK not available.")
            params = StdioServerParameters(command=cmd, args=args_list)
            async with stdio_client(params) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    return await do_call(session)
    except asyncio.TimeoutError:
        return {
            "success": False,
            "message": f"MCP tool {tool_name} timed out after {timeout_seconds}s",
        }
    except Exception as e:
        message = _format_mcp_invoke_error(e)
        if _is_unknown_tool_message(message):
            LOGGER.debug("MCP client could not call %s: %s", tool_name, message)
        else:
            LOGGER.exception("MCP client error calling %s", tool_name)
        return {"success": False, "message": message}


def _call_tool(
    tool_name: str,
    arguments: dict[str, Any],
    timeout_seconds: float | None = None,
) -> dict[str, Any]:
    """
    Call an MCP-Unity tool by name. Returns a dict with at least 'success' and
    optionally 'message', 'installed', 'scene_path', 'prefab_path',
    'error_count', 'warning_count', 'errors', 'warnings'.

    When MCP is disabled or not configured, returns a placeholder failure dict.
    """
    if not mcp_configured():
        return _placeholder_response()

    LOGGER.debug("MCP tool %s with args %s", tool_name, list(arguments.keys()))
    try:
        return asyncio.run(_call_tool_async(tool_name, arguments, timeout_seconds))
    except Exception as e:
        LOGGER.exception("MCP client error")
        return {"success": False, "message": f"MCP client error: {e!s}"}


class McpUnitySetupBackend:
    """Runs Unity setup via Unity-MCP-Server tools (MCP contract)."""

    def run_setup(
        self,
        project_path: Path,
        *,
        install_packages: bool = False,
        packages: list[str] | None = None,
        generate_scene: bool = False,
        scene_name: str = "MainScene",
        setup_urp: bool = False,
        timeout: int = 300,
        on_progress: Callable[[str, int, str], None] | None = None,
    ) -> SetupResult:
        logs: list[str] = []
        errors: list[str] = []
        project_path_str = str(project_path)
        timeout_sec = float(timeout) if timeout > 0 else None

        def progress(step: str, pct: int, msg: str) -> None:
            logs.append(f"[{step}] {msg}")
            if on_progress:
                on_progress(step, pct, msg)

        progress("mcp", 10, "Using MCP-Unity plugin for setup...")

        if not mcp_configured():
            message = "MCP-Unity plugin is not configured"
            errors.append(message)
            logs.append(f"[mcp] {message}")
            return SetupResult(success=False, errors=errors, logs=logs)

        if install_packages and packages:
            progress("mcp_packages", 25, f"Installing {len(packages)} package(s) via MCP...")
            result = _call_tool(
                "unity_install_packages",
                {"projectPath": project_path_str, "packages": packages},
                timeout_seconds=timeout_sec,
            )
            if not result.get("success"):
                errors.append(result.get("message", "Package installation failed"))
                return SetupResult(success=False, errors=errors, logs=logs)

        if generate_scene:
            progress("mcp_scene", 45, f"Creating scene {scene_name} via MCP...")
            result = _call_tool(
                "unity_create_default_scene",
                {"projectPath": project_path_str, "sceneName": scene_name},
                timeout_seconds=timeout_sec,
            )
            if not result.get("success"):
                errors.append(result.get("message", "Scene creation failed"))
                return SetupResult(success=False, errors=errors, logs=logs)

        if setup_urp:
            progress("mcp_urp", 60, "Configuring URP via MCP...")
            result = _call_tool(
                "unity_configure_urp",
                {"projectPath": project_path_str},
                timeout_seconds=timeout_sec,
            )
            if not result.get("success"):
                errors.append(result.get("message", "URP configuration failed"))
                return SetupResult(success=False, errors=errors, logs=logs)

        progress("mcp_capabilities", 72, "Checking Unity MCP capabilities...")
        caps = _probe_server_capabilities(timeout_sec)
        server = caps.get("server") if isinstance(caps.get("server"), dict) else {}
        if caps.get("success") is False and not server:
            message = caps.get("message") or "Failed to load Unity MCP capabilities"
            errors.append(message)
            return SetupResult(success=False, errors=errors, logs=logs)
        editor_available = bool(server.get("editorAvailable") or server.get("editor_available"))
        if not server and caps.get("notes"):
            logs.append(f"[mcp_capabilities] {caps['notes'][0]}")

        progress("mcp_lint", 76, "Running file-only project lint...")
        lint = _call_tool(
            LINT_TOOL_NAME,
            {"projectPath": project_path_str},
            timeout_seconds=timeout_sec,
        )
        lint_message = str(lint.get("message") or "")
        if _is_unknown_tool_message(lint_message):
            logs.append("[mcp_lint] unity_lint_project not available on this server version; skipped.")
        elif lint.get("success") is False and lint_message:
            logs.append(f"[mcp_lint] {lint_message}")

        if not editor_available:
            progress(
                "mcp_validate",
                80,
                "Skipping unity_validate_import because Unity Editor is unavailable.",
            )
            logs.append("[mcp_validate] Editor unavailable; import validation skipped (warning).")
        else:
            progress("mcp_validate", 80, "Validating imports via MCP...")
            result = _call_tool(
                "unity_validate_import",
                {"projectPath": project_path_str},
                timeout_seconds=timeout_sec,
            )
            if not result.get("success"):
                raw_errors = result.get("errors") or [result.get("message", "Validation failed")]
                err_list = [
                    item.get("message", json.dumps(item, ensure_ascii=False)) if isinstance(item, dict) else str(item)
                    for item in raw_errors
                ]
                errors.extend(err_list)
                return SetupResult(success=False, errors=errors, logs=logs)

        progress("mcp", 90, "MCP-Unity setup completed successfully.")
        return SetupResult(success=True, errors=[], logs=logs)
