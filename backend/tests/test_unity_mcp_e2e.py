"""
End-to-end integration tests for Unity MCP Server + Semantic Kernel.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from agents.unity_mcp_plugin import MCPToolSchema
from backend.app.kernel import create_kernel


@pytest.mark.asyncio
async def test_kernel_unity_mcp_integration():
    """
    Test that the UnityMCPPlugin is correctly registered in the kernel
    and can be invoked.
    """
    # Create the kernel
    kernel = create_kernel({})
    assert "UnityMCP" in kernel.plugins

    # Get the function
    ping_func = kernel.plugins["UnityMCP"]["ping"]

    # The 'instance' is the self of the function
    # In SK 1.x, KernelFunctionFromMethod has a 'method' which is a bound method
    plugin_instance = ping_func.method.__self__

    # Manually populate tools to bypass discovery for this test
    plugin_instance.tools = {
        "ping": MCPToolSchema(
            name="ping",
            description="Test",
            input_schema={"properties": {"message": {"type": "string"}}},
            required_params=[],
        )
    }
    plugin_instance._initialized = True

    with patch.object(plugin_instance.client, "call_tool", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"success": True, "message": "pong"}

        # Invoke via kernel
        result = await kernel.invoke(ping_func, message="Hello Unity")

        # Verify
        result_data = json.loads(str(result))
        assert result_data["status"] == "connected"
        assert result_data["message"] == "pong"


@pytest.mark.asyncio
async def test_kernel_create_gameobject_e2e():
    """Test e2e invocation of create_gameobject via kernel."""
    kernel = create_kernel({})
    func = kernel.plugins["UnityMCP"]["create_gameobject"]
    plugin_instance = func.method.__self__

    plugin_instance.tools = {
        "create_gameobject": MCPToolSchema(
            name="create_gameobject",
            description="Create",
            input_schema={
                "properties": {"name": {"type": "string"}, "type": {"type": "string"}, "position": {"type": "object"}}
            },
            required_params=["name"],
        )
    }
    plugin_instance._initialized = True

    with patch.object(plugin_instance.client, "call_tool", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"success": True, "name": "Player", "instanceId": 123}

        # Invoke
        result = await kernel.invoke(func, name="Player", object_type="cube", position_y=5.0)

        result_data = json.loads(str(result))
        assert result_data["success"] is True
        assert result_data["instance_id"] == 123

        # Verify arg translation
        args = mock_call.call_args[0][1]
        assert args["name"] == "Player"
        assert args["position"]["y"] == 5.0
