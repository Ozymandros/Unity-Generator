from __future__ import annotations

from typing import Any

import pytest
from semantic_kernel.functions.kernel_arguments import KernelArguments

from app.agents.unity_mcp_sk.core.tool_mapper import DefaultToolDefinitionMapper, parse_mcp_tool_definition
from app.agents.unity_mcp_sk.plugin.unity_mcp_semantic_plugin import UnityMcpSemanticPlugin
from app.agents.unity_mcp_sk.sk_integration.kernel_factory import create_kernel_with_unity_async
from app.agents.unity_mcp_sk.sk_integration.kernel_registration import register_unity_tools_as_functions


class FakeMcpClient:
    def __init__(self, tools: list[dict[str, Any]]) -> None:
        self._tools = tools
        self.list_tools_calls = 0
        self.invoke_calls: list[tuple[str, dict[str, Any]]] = []

    async def list_tools(self) -> list[dict[str, Any]]:
        self.list_tools_calls += 1
        return self._tools

    async def invoke_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        self.invoke_calls.append((tool_name, arguments))
        return {"success": True, "tool": tool_name, "arguments": arguments}


def _build_tools_fixture() -> list[dict[str, Any]]:
    return [
        {
            "name": "z_ping",
            "description": "Ping tool.",
            "inputSchema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "build_scene",
            "description": "Build a scene from parameters.",
            "inputSchema": {
                "type": "object",
                "required": ["projectPath", "count"],
                "properties": {
                    "projectPath": {"type": "string", "description": "Unity project path."},
                    "count": {"type": "integer", "description": "Object count."},
                    "usePhysics": {"type": "boolean", "description": "Enable physics.", "default": False},
                    "weights": {"type": "array", "description": "Distribution weights."},
                    "settings": {"type": "object", "description": "Scene settings."},
                    "temperature": {"type": "number", "description": "Numeric tuning.", "default": 0.3},
                },
            },
            "outputSchema": {"type": "object"},
        },
        {
            "name": "a_echo",
            "description": "Echo tool.",
            "inputSchema": {
                "type": "object",
                "required": ["message"],
                "properties": {"message": {"type": "string", "description": "Message."}},
            },
        },
    ]


@pytest.mark.asyncio
async def test_get_registered_tools_returns_sorted_tools() -> None:
    mapper = DefaultToolDefinitionMapper()
    parsed = [parse_mcp_tool_definition(item) for item in _build_tools_fixture()]
    mapper.initialize(parsed)

    registered_names = [tool.name for tool in mapper.get_registered_tools()]
    assert registered_names == ["a_echo", "build_scene", "z_ping"]


@pytest.mark.asyncio
async def test_kernel_factory_lists_tools_only_once() -> None:
    client = FakeMcpClient(_build_tools_fixture())
    kernel, plugin = await create_kernel_with_unity_async(client=client, plugin_name="unity", expanded_mode=True)

    assert kernel is not None
    assert plugin.is_initialized is True
    assert client.list_tools_calls == 1

    register_unity_tools_as_functions(kernel=kernel, plugin=plugin, plugin_name="unity_v2")
    assert client.list_tools_calls == 1


@pytest.mark.asyncio
async def test_expanded_registration_uses_single_plugin_namespace() -> None:
    client = FakeMcpClient(_build_tools_fixture())
    kernel, _ = await create_kernel_with_unity_async(client=client, plugin_name="unity", expanded_mode=True)

    plugin = kernel.get_plugin("unity")
    assert plugin is not None
    assert "unity" in list(kernel.plugins)
    assert set(plugin.functions.keys()) == {"a_echo", "build_scene", "z_ping"}


@pytest.mark.asyncio
async def test_registered_metadata_matches_mcp_schema() -> None:
    client = FakeMcpClient(_build_tools_fixture())
    kernel, _ = await create_kernel_with_unity_async(client=client, plugin_name="unity", expanded_mode=True)

    plugin = kernel.get_plugin("unity")
    function = plugin["build_scene"]
    parameters = {parameter.name: parameter for parameter in function.metadata.parameters}

    assert parameters["projectPath"].type_ == "string"
    assert parameters["projectPath"].is_required is True
    assert parameters["count"].type_ == "integer"
    assert parameters["count"].is_required is True
    assert parameters["temperature"].type_ == "number"
    assert parameters["temperature"].default_value == 0.3
    assert parameters["temperature"].is_required is False
    assert parameters["usePhysics"].type_ == "boolean"
    assert parameters["usePhysics"].default_value is False
    assert parameters["weights"].type_ == "array"
    assert parameters["settings"].type_ == "object"


@pytest.mark.asyncio
async def test_router_mode_still_works() -> None:
    client = FakeMcpClient(_build_tools_fixture())
    kernel, _ = await create_kernel_with_unity_async(client=client, plugin_name="unity", expanded_mode=False)

    plugin = kernel.get_plugin("unity")
    assert set(plugin.functions.keys()) == {"invoke"}

    result = await kernel.invoke(
        function_name="invoke",
        plugin_name="unity",
        arguments=KernelArguments(tool_name="a_echo", arguments={"message": "hello"}),
    )
    assert result is not None
    assert client.invoke_calls == [("a_echo", {"message": "hello"})]

