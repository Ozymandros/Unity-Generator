import os

import pytest
from agents.unity_mcp_plugin import UnityMCPPluginWrapper
from semantic_kernel.connectors.mcp import MCPSsePlugin
from semantic_kernel.exceptions.kernel_exceptions import KernelPluginInvalidConfigurationError


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_connect_and_discover(monkeypatch):
    # Use a dummy URL for testing (should fail if no server is running)
    url = os.environ.get("UNITY_MCP_URL", "http://localhost:8080")
    plugin = UnityMCPPluginWrapper(url=url)
    try:
        await plugin.initialize()
        # If the server is running, plugin._plugin should be an MCPSsePlugin
        assert isinstance(plugin._plugin, MCPSsePlugin)
        # Should have discovered tools (if server is running)
        assert hasattr(plugin._plugin, "tools")
    except Exception as e:
        # If server is not running, should raise a connection error
        assert "Connection" in str(e) or "refused" in str(e) or "Failed to connect" in str(e)
    finally:
        await plugin.close()


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_error(monkeypatch):
    # Use an invalid URL to force error
    plugin = UnityMCPPluginWrapper(url="http://localhost:9999")
    with pytest.raises(KernelPluginInvalidConfigurationError):
        await plugin.initialize()
    await plugin.close()
