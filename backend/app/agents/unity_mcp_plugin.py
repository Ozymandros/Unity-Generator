import asyncio
import logging
from contextlib import asynccontextmanager

from semantic_kernel.connectors.mcp import MCPStdioPlugin
from semantic_kernel import Kernel

LOGGER = logging.getLogger("unity_mcp_plugin")


async def _check_unity_mcp_live() -> bool:
    """
    Verify a live connection to the Unity MCP server (e.g. via ping).
    Returns True only when the server is reachable and responds.
    """
    try:
        async with create_unity_mcp_plugin() as mcp_plugin:
            kernel = Kernel()
            kernel.add_plugin(mcp_plugin, "UnityMCP")
            plugin = kernel.get_plugin("UnityMCP")
            if plugin and "ping" in plugin:
                await kernel.invoke(plugin["ping"])
            return True
    except Exception as e:
        LOGGER.debug("Unity MCP live check failed: %s", e)
        return False


def unity_mcp_plugin_available_for_writing() -> bool:
    """
    Return True only when a live connection to the Unity MCP server can be established.
    Used to decide whether to skip manual file writes (asset_saver, sprite_service).
    """
    try:
        return asyncio.run(_check_unity_mcp_live())
    except Exception as e:
        LOGGER.debug("Unity MCP availability check failed: %s", e)
        return False


@asynccontextmanager
async def create_unity_mcp_plugin():
    """
    Async context manager for the Unity MCP plugin (global unity-mcp tool).
    Use with: async with create_unity_mcp_plugin() as mcp_plugin: ...
    """
    LOGGER.info("Creating UnityMCP plugin...")
    try:
        plugin = MCPStdioPlugin(
            name="UnityMCP",
            description="Unity Editor automation tools",
            command="unity-mcp",
            args=[],
            load_tools=True,
            request_timeout=30,
        )
        async with plugin as mcp_plugin:
            LOGGER.info("UnityMCP plugin created successfully.")
            yield mcp_plugin
    except Exception as e:
        LOGGER.error("Failed to create UnityMCP plugin: %s", e)
        raise