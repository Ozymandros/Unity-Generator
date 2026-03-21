"""Core contracts and value objects for Unity MCP SK integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


MCP_JSON_TYPE_TO_SK_TYPE: dict[str, str] = {
    "string": "string",
    "number": "number",
    "integer": "integer",
    "boolean": "boolean",
    "array": "array",
    "object": "object",
}


@dataclass(frozen=True)
class ToolParameterDefinition:
    """
    Represents an MCP tool parameter as a typed, SK-ready value object.

    Args:
        name: Exact parameter name from MCP schema.
        description: Human-readable parameter description.
        json_type: MCP JSON schema type.
        required: Whether the parameter is required.
        default: Optional default value from MCP schema.
        schema: Full original JSON schema fragment for this parameter.
    """

    name: str
    description: str
    json_type: str
    required: bool
    default: Any = None
    schema: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ToolDefinition:
    """
    Represents one discovered MCP tool definition.

    Args:
        name: MCP tool name.
        description: Tool description exposed to SK planners/agents.
        parameters: Parsed input parameters from MCP input schema.
        return_schema: Optional output schema metadata when available.
        raw_input_schema: Raw MCP input schema for metadata passthrough.
    """

    name: str
    description: str
    parameters: tuple[ToolParameterDefinition, ...]
    return_schema: dict[str, Any] = field(default_factory=dict)
    raw_input_schema: dict[str, Any] = field(default_factory=dict)


class ToolDefinitionMapper(Protocol):
    """Maps/discovers MCP tool definitions and stores a deterministic registry."""

    def initialize(self, tool_definitions: list[ToolDefinition]) -> None:
        """Initialize mapper with tool definitions."""

    def map_tool_definition(self, tool_definition: ToolDefinition) -> ToolDefinition:
        """Normalize a tool definition for SK registration."""

    def get_tool_by_name(self, name: str) -> ToolDefinition | None:
        """Return a registered tool definition by name."""

    def get_tool_names(self) -> list[str]:
        """Return all registered tool names in deterministic order."""

    def get_registered_tools(self) -> list[ToolDefinition]:
        """Return all registered tool definitions in deterministic order."""


class McpToolClient(Protocol):
    """Client contract for listing and invoking MCP tools."""

    async def list_tools(self) -> list[dict[str, Any]]:
        """Return raw MCP tool definitions."""

    async def invoke_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Invoke one MCP tool with arguments."""

