"""Unity MCP semantic plugin runtime abstraction."""

from __future__ import annotations

from typing import Any

from ..core.contracts import McpToolClient, ToolDefinition, ToolDefinitionMapper
from ..core.tool_mapper import DefaultToolDefinitionMapper, parse_mcp_tool_definition


class UnityMcpSemanticPlugin:
    """Owns MCP discovery state and tool invocation behavior for SK registration."""

    def __init__(self, client: McpToolClient, mapper: ToolDefinitionMapper | None = None) -> None:
        if client is None:
            raise ValueError("client must not be None.")
        self._client = client
        self._mapper = mapper or DefaultToolDefinitionMapper()
        self._is_initialized = False

    @property
    def is_initialized(self) -> bool:
        """Return whether discovery has completed at least once."""
        return self._is_initialized

    async def initialize(self) -> None:
        """
        Discover MCP tools once and cache them in the mapper.

        Repeated calls are idempotent and do not re-query the MCP server.
        """
        if self._is_initialized:
            return
        raw_tools = await self._client.list_tools()
        parsed_tools = [parse_mcp_tool_definition(raw_tool) for raw_tool in raw_tools]
        self._mapper.initialize(parsed_tools)
        self._is_initialized = True

    async def invoke_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """
        Invoke an MCP tool through the configured client.

        Args:
            tool_name: Name of the tool to invoke.
            arguments: Tool arguments.

        Returns:
            Raw MCP tool invocation result.
        """
        return await self._client.invoke_tool(tool_name=tool_name, arguments=arguments)

    def get_tool_by_name(self, name: str) -> ToolDefinition | None:
        """Return a single registered tool definition by name."""
        return self._mapper.get_tool_by_name(name)

    def get_tool_names(self) -> list[str]:
        """Return all registered tool names in deterministic order."""
        return self._mapper.get_tool_names()

    def get_registered_tools(self) -> list[ToolDefinition]:
        """Return all registered tool definitions in deterministic order."""
        return self._mapper.get_registered_tools()

