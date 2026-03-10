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
    from mcp.client.streamable_http import streamable_http_client
except ImportError:
    streamable_http_client = None


def mcp_available() -> bool:
    """Return True if MCP is enabled and the server is configured (and SDK present)."""
    if _MCP_AVAILABLE:
        return True
    raw = os.environ.get(_ENV_USE_MCP, "").strip().lower()
    if raw not in ("1", "true", "yes"):
        return False
    if ClientSession is None:
        return False
    url = os.environ.get(_ENV_SERVER_URL, "").strip()
    cmd = os.environ.get(_ENV_COMMAND, "unity-mcp").strip()
    return bool(url or cmd)


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

    return out


async def _call_tool_async(
    tool_name: str,
    arguments: dict[str, Any],
    timeout_seconds: float | None = None,
) -> dict[str, Any]:
    """Connect to MCP server, call tool, return normalized dict."""
    if not mcp_available():
        return _placeholder_response()

    url = os.environ.get(_ENV_SERVER_URL, "").strip()
    cmd = os.environ.get(_ENV_COMMAND, "unity-mcp").strip()
    args_list = os.environ.get(_ENV_ARGS, "").strip().split() if os.environ.get(_ENV_ARGS) else []

    async def do_call(session: Any) -> dict[str, Any]:
        if timeout_seconds is not None and timeout_seconds > 0:
            result = await asyncio.wait_for(
                session.call_tool(tool_name, arguments),
                timeout=timeout_seconds,
            )
        else:
            result = await session.call_tool(tool_name, arguments)

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
        LOGGER.exception("MCP client error calling %s", tool_name)
        return {"success": False, "message": f"MCP client error: {e!s}"}


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
    if not mcp_available():
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

        progress("mcp_validate", 80, "Validating imports via MCP...")
        result = _call_tool(
            "unity_validate_import",
            {"projectPath": project_path_str},
            timeout_seconds=timeout_sec,
        )
        if not result.get("success"):
            err_list = result.get("errors") or [result.get("message", "Validation failed")]
            errors.extend(err_list)
            return SetupResult(success=False, errors=errors, logs=logs)

        progress("mcp", 90, "MCP-Unity setup completed successfully.")
        return SetupResult(success=True, errors=[], logs=logs)
