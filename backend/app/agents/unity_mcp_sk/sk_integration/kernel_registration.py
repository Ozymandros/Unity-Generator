"""Helpers for registering Unity MCP tools into Semantic Kernel."""

from __future__ import annotations

from typing import Any

from semantic_kernel import Kernel
from semantic_kernel.functions import KernelPlugin, kernel_function
from semantic_kernel.functions.kernel_function_from_method import KernelFunctionFromMethod
from semantic_kernel.functions.kernel_parameter_metadata import KernelParameterMetadata

from ..core.contracts import MCP_JSON_TYPE_TO_SK_TYPE, ToolDefinition, ToolParameterDefinition
from ..plugin.unity_mcp_semantic_plugin import UnityMcpSemanticPlugin

_JSON_TYPE_TO_PYTHON_TYPE: dict[str, type[Any]] = {
    "string": str,
    "number": float,
    "integer": int,
    "boolean": bool,
    "array": list,
    "object": dict,
}


def _build_parameter_metadata(parameter: ToolParameterDefinition) -> KernelParameterMetadata:
    default_value = parameter.default
    is_required = parameter.required
    if default_value is not None and is_required:
        # Default values imply optional semantics for planners.
        is_required = False
    json_type = parameter.json_type if parameter.json_type in MCP_JSON_TYPE_TO_SK_TYPE else "object"
    return KernelParameterMetadata(
        name=parameter.name,
        description=parameter.description,
        default_value=default_value,
        type_=MCP_JSON_TYPE_TO_SK_TYPE[json_type],
        is_required=is_required,
        type_object=_JSON_TYPE_TO_PYTHON_TYPE.get(json_type, dict),
        schema_data=parameter.schema,
    )


def _build_return_metadata(tool_definition: ToolDefinition) -> KernelParameterMetadata:
    return KernelParameterMetadata(
        name="return",
        description=f"Result from MCP tool '{tool_definition.name}'.",
        default_value=None,
        type_="object",
        is_required=True,
        type_object=dict,
        schema_data=tool_definition.return_schema or {"type": "object"},
    )


def _create_tool_function(tool_definition: ToolDefinition, plugin: UnityMcpSemanticPlugin, plugin_name: str) -> Any:
    @kernel_function(name=tool_definition.name, description=tool_definition.description)
    async def _invoke_tool(**kwargs: Any) -> Any:
        return await plugin.invoke_tool(tool_definition.name, kwargs)

    return KernelFunctionFromMethod(
        method=_invoke_tool,
        plugin_name=plugin_name,
        parameters=[_build_parameter_metadata(parameter) for parameter in tool_definition.parameters],
        return_parameter=_build_return_metadata(tool_definition),
        additional_metadata={
            "mcp_input_schema": tool_definition.raw_input_schema,
            "mcp_return_schema": tool_definition.return_schema,
        },
    )


def register_unity_tools_as_functions(
    kernel: Kernel,
    plugin: UnityMcpSemanticPlugin,
    plugin_name: str = "unity",
) -> KernelPlugin:
    """
    Register discovered MCP tools as individual Semantic Kernel functions.

    Args:
        kernel: Target Semantic Kernel instance.
        plugin: Initialized Unity MCP semantic plugin.
        plugin_name: SK namespace under which all tool functions are registered.

    Returns:
        Registered KernelPlugin handle.

    Raises:
        RuntimeError: If plugin has no discovered tools (not initialized or empty).
    """
    if kernel is None:
        raise ValueError("kernel must not be None.")
    if plugin is None:
        raise ValueError("plugin must not be None.")
    if not plugin_name or not isinstance(plugin_name, str):
        raise ValueError("plugin_name must be a non-empty string.")

    tool_definitions = plugin.get_registered_tools()
    if not tool_definitions:
        raise RuntimeError(
            "Unity MCP plugin has no registered tools. Initialize plugin before registering with Semantic Kernel."
        )

    functions = [_create_tool_function(tool_definition, plugin, plugin_name) for tool_definition in tool_definitions]
    sk_plugin = KernelPlugin(name=plugin_name, description="Unity MCP tools", functions=functions)
    return kernel.add_plugin(sk_plugin, plugin_name=plugin_name)


def register_unity_router_function(
    kernel: Kernel,
    plugin: UnityMcpSemanticPlugin,
    plugin_name: str = "unity",
) -> KernelPlugin:
    """Register a single generic router function for backward compatibility."""
    if kernel is None:
        raise ValueError("kernel must not be None.")
    if plugin is None:
        raise ValueError("plugin must not be None.")
    if not plugin_name or not isinstance(plugin_name, str):
        raise ValueError("plugin_name must be a non-empty string.")

    @kernel_function(
        name="invoke",
        description="Invoke any Unity MCP tool by passing tool_name and arguments.",
    )
    async def _invoke(**kwargs: Any) -> Any:
        raw_arguments = kwargs.get("arguments")
        if hasattr(raw_arguments, "items"):
            argument_payload = dict(raw_arguments)
        elif isinstance(raw_arguments, dict):
            argument_payload = raw_arguments
        else:
            argument_payload = {}

        tool_name = kwargs.get("tool_name") or argument_payload.get("tool_name")
        if not tool_name or not isinstance(tool_name, str):
            raise ValueError("tool_name must be a non-empty string.")

        # Some SK call paths wrap both router args into one payload object.
        if "arguments" in argument_payload and isinstance(argument_payload.get("arguments"), dict):
            resolved_arguments = argument_payload["arguments"]
        else:
            resolved_arguments = argument_payload
        if not isinstance(resolved_arguments, dict):
            raise ValueError("arguments must be an object when provided.")
        return await plugin.invoke_tool(tool_name, resolved_arguments)

    router_function = KernelFunctionFromMethod(
        method=_invoke,
        plugin_name=plugin_name,
        parameters=[
            KernelParameterMetadata(
                name="tool_name",
                description="MCP tool name to invoke.",
                default_value=None,
                type_="string",
                is_required=True,
                type_object=str,
                schema_data={"type": "string"},
            ),
            KernelParameterMetadata(
                name="arguments",
                description="Arguments object passed to the selected MCP tool.",
                default_value={},
                type_="object",
                is_required=False,
                type_object=dict,
                schema_data={"type": "object"},
            ),
        ],
        return_parameter=KernelParameterMetadata(
            name="return",
            description="Result from the selected MCP tool.",
            default_value=None,
            type_="object",
            is_required=True,
            type_object=dict,
            schema_data={"type": "object"},
        ),
    )

    sk_plugin = KernelPlugin(name=plugin_name, description="Unity MCP router", functions=[router_function])
    return kernel.add_plugin(sk_plugin, plugin_name=plugin_name)

