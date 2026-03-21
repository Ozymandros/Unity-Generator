"""Default tool-definition mapper for Unity MCP SK integration."""

from __future__ import annotations

from typing import Any

from .contracts import MCP_JSON_TYPE_TO_SK_TYPE, ToolDefinition, ToolDefinitionMapper, ToolParameterDefinition


class DefaultToolDefinitionMapper(ToolDefinitionMapper):
    """Stores normalized tool definitions and exposes deterministic lookup APIs."""

    def __init__(self) -> None:
        self._tools_by_name: dict[str, ToolDefinition] = {}

    def initialize(self, tool_definitions: list[ToolDefinition]) -> None:
        self._tools_by_name = {tool.name: self.map_tool_definition(tool) for tool in tool_definitions}

    def map_tool_definition(self, tool_definition: ToolDefinition) -> ToolDefinition:
        normalized_parameters = tuple(
            ToolParameterDefinition(
                name=parameter.name,
                description=parameter.description,
                json_type=parameter.json_type if parameter.json_type in MCP_JSON_TYPE_TO_SK_TYPE else "object",
                required=parameter.required,
                default=parameter.default,
                schema=parameter.schema,
            )
            for parameter in tool_definition.parameters
        )
        return ToolDefinition(
            name=tool_definition.name,
            description=tool_definition.description,
            parameters=normalized_parameters,
            return_schema=tool_definition.return_schema,
            raw_input_schema=tool_definition.raw_input_schema,
        )

    def get_tool_by_name(self, name: str) -> ToolDefinition | None:
        return self._tools_by_name.get(name)

    def get_tool_names(self) -> list[str]:
        return sorted(self._tools_by_name.keys())

    def get_registered_tools(self) -> list[ToolDefinition]:
        return [self._tools_by_name[name] for name in self.get_tool_names()]


def parse_mcp_tool_definition(raw_tool: dict[str, Any]) -> ToolDefinition:
    """
    Parse one raw MCP tool definition into a typed value object.

    Args:
        raw_tool: Raw MCP tool object with `name`, `description`, and `inputSchema`.

    Returns:
        Parsed `ToolDefinition` with stable parameter extraction.

    Raises:
        ValueError: If required fields are missing or malformed.
    """
    name = raw_tool.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("MCP tool definition is missing a valid 'name'.")

    description = raw_tool.get("description") if isinstance(raw_tool.get("description"), str) else ""
    input_schema = raw_tool.get("inputSchema") if isinstance(raw_tool.get("inputSchema"), dict) else {}
    return_schema = raw_tool.get("outputSchema") if isinstance(raw_tool.get("outputSchema"), dict) else {}
    required = input_schema.get("required") if isinstance(input_schema.get("required"), list) else []
    required_names = {item for item in required if isinstance(item, str)}
    properties = input_schema.get("properties") if isinstance(input_schema.get("properties"), dict) else {}

    parameters: list[ToolParameterDefinition] = []
    for parameter_name in sorted(properties.keys()):
        schema = properties.get(parameter_name)
        if not isinstance(schema, dict):
            continue
        parameter_description = schema.get("description") if isinstance(schema.get("description"), str) else ""
        json_type = schema.get("type") if isinstance(schema.get("type"), str) else "object"
        parameters.append(
            ToolParameterDefinition(
                name=parameter_name,
                description=parameter_description,
                json_type=json_type,
                required=parameter_name in required_names,
                default=schema.get("default"),
                schema=schema,
            )
        )

    return ToolDefinition(
        name=name,
        description=description,
        parameters=tuple(parameters),
        return_schema=return_schema,
        raw_input_schema=input_schema,
    )

