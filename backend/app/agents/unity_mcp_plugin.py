import logging
from contextlib import asynccontextmanager

from semantic_kernel.connectors.mcp import MCPStdioPlugin

LOGGER = logging.getLogger("unity_mcp_plugin")


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