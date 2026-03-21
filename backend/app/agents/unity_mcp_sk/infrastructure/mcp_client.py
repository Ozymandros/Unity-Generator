"""Infrastructure MCP client adapter for Unity MCP SK integration."""

from __future__ import annotations

from typing import Any

from ..core.contracts import McpToolClient


class UnityMcpClientAdapter(McpToolClient):
    """
    Minimal adapter around an MCP session-like object.

    The wrapped object must expose:
    - `list_tools()` -> object with `.tools` or a dict containing `tools`
    - `call_tool(tool_name, arguments)` -> tool result
    """

    def __init__(self, session: Any) -> None:
        if session is None:
            raise ValueError("session must not be None")
        self._session = session

    async def list_tools(self) -> list[dict[str, Any]]:
        raw = await self._session.list_tools()
        if isinstance(raw, dict):
            tools = raw.get("tools", [])
            return [item for item in tools if isinstance(item, dict)]
        tools = getattr(raw, "tools", [])
        if not isinstance(tools, list):
            return []
        return [item for item in tools if isinstance(item, dict)]

    async def invoke_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        if not tool_name or not isinstance(tool_name, str):
            raise ValueError("tool_name must be a non-empty string.")
        if arguments is None or not isinstance(arguments, dict):
            raise ValueError("arguments must be a dictionary.")
        return await self._session.call_tool(tool_name, arguments)

