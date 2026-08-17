"""
Official MCP SDK client adapter for unity-mcp-plugin.

Unity MCP Server 3.2.x speaks the Model Context Protocol ``tools/call`` surface.
The bundled ``StdioMcpClient`` in unity-mcp-plugin still sends legacy JSON-RPC
requests (``method=tool_name``), which the server rejects with
``Method '<tool>' is not available`` for most tools. This adapter implements
``IMcpClient`` using the official Python MCP SDK so Semantic Kernel agents can
invoke tools reliably.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from unity_mcp.models import (
    ConnectionState,
    McpError,
    McpParameterDefinition,
    McpResponse,
    McpToolDefinition,
    UnityMcpOptions,
)

LOGGER = logging.getLogger(__name__)

try:
    from mcp import ClientSession
    from mcp.client.stdio import StdioServerParameters, stdio_client
    from mcp.types import TextContent
except ImportError:
    ClientSession = None
    StdioServerParameters = None
    stdio_client = None
    TextContent = None


def _parse_tool_content(result: Any) -> Any:
    """
    Parse MCP tool call content blocks into a Python value.

    Args:
        result: MCP ``CallToolResult`` from the SDK.

    Returns:
        Parsed JSON value, concatenated text, or None when empty.
    """
    if result is None or TextContent is None:
        return None

    chunks: list[str] = []
    for block in getattr(result, "content", []) or []:
        if isinstance(block, TextContent) and block.text:
            chunks.append(block.text)

    if not chunks:
        return None

    combined = "".join(chunks).strip()
    if not combined:
        return None

    try:
        return json.loads(combined)
    except json.JSONDecodeError:
        return combined


def _map_sdk_tool(tool: Any) -> McpToolDefinition:
    """
    Convert an MCP SDK tool descriptor to ``McpToolDefinition``.

    Args:
        tool: Tool object from ``session.list_tools()``.

    Returns:
        Plugin-compatible tool definition.
    """
    schema = getattr(tool, "inputSchema", None) or {}
    if not isinstance(schema, dict):
        schema = {}
    props = schema.get("properties", {})
    if not isinstance(props, dict):
        props = {}
    required = set(schema.get("required", []) or [])

    parameters: dict[str, McpParameterDefinition] = {}
    for name, definition in props.items():
        if not isinstance(definition, dict):
            continue
        parameters[name] = McpParameterDefinition(
            name=name,
            type=str(definition.get("type", "string")),
            description=definition.get("description"),
            required=name in required,
            default_value=definition.get("default"),
        )

    return McpToolDefinition(
        name=str(getattr(tool, "name", "") or ""),
        description=str(getattr(tool, "description", "") or ""),
        parameters=parameters,
    )


class OfficialMcpSdkClient:
    """
    MCP client that uses the official Python MCP SDK over stdio.

    Implements the ``IMcpClient`` protocol expected by ``UnityMCPPlugin``.
    """

    def __init__(self, options: UnityMcpOptions) -> None:
        if options is None:
            raise ValueError("options is required")
        options.validate()
        self._options = options
        self._state = ConnectionState.DISCONNECTED
        self._lock = asyncio.Lock()
        self._last_success = datetime.min.replace(tzinfo=timezone.utc)
        self._stdio_context: Any = None
        self._session_context: Any = None
        self._session: Any = None

    @property
    def state(self) -> ConnectionState:
        """Current connection lifecycle state."""
        return self._state

    async def connect(self, cancellation_token: Any = None) -> None:
        """Start unity-mcp via stdio and initialize an MCP session."""
        if ClientSession is None or stdio_client is None or StdioServerParameters is None:
            raise RuntimeError("MCP Python SDK is not installed")

        async with self._lock:
            if self._session is not None:
                return

            self._state = ConnectionState.CONNECTING
            params = StdioServerParameters(
                command=self._options.executable_path,
                args=list(self._options.args or []),
            )
            try:
                self._stdio_context = stdio_client(params)
                read_stream, write_stream = await self._stdio_context.__aenter__()
                self._session_context = ClientSession(read_stream, write_stream)
                self._session = await self._session_context.__aenter__()
                await asyncio.wait_for(
                    self._session.initialize(),
                    timeout=self._options.connection_timeout_seconds,
                )
                self._state = ConnectionState.CONNECTED
                self._last_success = datetime.now(timezone.utc)
                LOGGER.info("Connected to Unity MCP server via official MCP SDK")
            except Exception as exc:
                await self._cleanup_unlocked()
                self._state = ConnectionState.FAULTED
                raise RuntimeError(f"Failed to connect to Unity MCP server: {exc}") from exc

    async def list_tools(self, cancellation_token: Any = None) -> list[McpToolDefinition]:
        """Discover tools exposed by the connected MCP server."""
        await self._ensure_connected()
        assert self._session is not None
        response = await asyncio.wait_for(
            self._session.list_tools(),
            timeout=self._options.request_timeout_seconds,
        )
        tools = [_map_sdk_tool(tool) for tool in response.tools if getattr(tool, "name", "")]
        LOGGER.info("Discovered %d Unity MCP tools via official SDK", len(tools))
        return tools

    async def invoke_tool(
        self,
        tool_name: str,
        parameters: dict[str, Any],
        cancellation_token: Any = None,
    ) -> McpResponse:
        """
        Invoke a Unity MCP tool using ``tools/call``.

        Args:
            tool_name: Registered MCP tool name.
            parameters: Tool arguments.

        Returns:
            Plugin-compatible ``McpResponse``.
        """
        if not isinstance(tool_name, str) or not tool_name.strip():
            raise ValueError("tool_name must be a non-empty string")
        if not isinstance(parameters, dict):
            raise TypeError("parameters must be a dictionary")

        await self._ensure_connected()
        assert self._session is not None

        filtered = {key: value for key, value in parameters.items() if value is not None}
        result = await asyncio.wait_for(
            self._session.call_tool(tool_name.strip(), filtered),
            timeout=self._options.request_timeout_seconds,
        )
        parsed = _parse_tool_content(result)
        if getattr(result, "isError", False):
            message = parsed if isinstance(parsed, str) else json.dumps(parsed, ensure_ascii=False)
            return McpResponse(
                id=tool_name,
                success=False,
                result=parsed,
                error=McpError(code=-1, message=message or f"Tool '{tool_name}' returned an error"),
            )

        self._last_success = datetime.now(timezone.utc)
        return McpResponse(id=tool_name, success=True, result=parsed)

    async def ping(self, cancellation_token: Any = None) -> bool:
        """Return True when the server responds to ``ping``."""
        try:
            response = await self.invoke_tool("ping", {})
            return response.success
        except Exception:
            return False

    def is_healthy(self) -> bool:
        """Return True when connected and recently successful."""
        if self._state != ConnectionState.CONNECTED:
            return False
        idle = datetime.now(timezone.utc) - self._last_success
        return idle < timedelta(seconds=self._options.max_idle_time_seconds)

    async def close(self) -> None:
        """Shut down the MCP session and subprocess."""
        async with self._lock:
            await self._cleanup_unlocked()

    async def _ensure_connected(self) -> None:
        if self._session is None:
            await self.connect()

    async def _cleanup_unlocked(self) -> None:
        if self._session_context is not None:
            try:
                await self._session_context.__aexit__(None, None, None)
            except Exception as exc:
                LOGGER.debug("MCP session cleanup failed: %s", exc)
        if self._stdio_context is not None:
            try:
                await self._stdio_context.__aexit__(None, None, None)
            except Exception as exc:
                LOGGER.debug("MCP stdio cleanup failed: %s", exc)

        self._session = None
        self._session_context = None
        self._stdio_context = None
        self._state = ConnectionState.DISCONNECTED
