import asyncio
import logging
import os
from contextlib import asynccontextmanager

from semantic_kernel import Kernel
from unity_mcp import UnityMcpOptions, UnityMCPPlugin

LOGGER = logging.getLogger("unity_mcp_plugin")
_ENV_MCP_COMMAND = "UNITY_MCP_COMMAND"
_ENV_MCP_ARGS = "UNITY_MCP_ARGS"
_DEFAULT_MCP_EXECUTABLE = "unity-mcp"


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
            elif hasattr(mcp_plugin, "is_healthy"):
                if not mcp_plugin.is_healthy():
                    return False
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
    Async context manager for the Unity MCP plugin.

    Uses the local `unity-mcp-plugin` package implementation and initializes
    the plugin against the configured Unity MCP executable.

    Use with: async with create_unity_mcp_plugin() as mcp_plugin: ...
    """
    LOGGER.info("Creating UnityMCP plugin...")
    command = os.environ.get(_ENV_MCP_COMMAND, _DEFAULT_MCP_EXECUTABLE).strip() or _DEFAULT_MCP_EXECUTABLE
    mcp_args = os.environ.get(_ENV_MCP_ARGS, "").strip()
    if mcp_args:
        LOGGER.warning(
            "%s is set but ignored by unity-mcp-plugin local package implementation.",
            _ENV_MCP_ARGS,
        )

    try:
        options = UnityMcpOptions(
            executable_path=command,
            connection_timeout_seconds=30,
            request_timeout_seconds=30,
            enable_message_logging=False,
        )
        plugin = UnityMCPPlugin.create(options)
        await plugin.initialize()
        LOGGER.info("UnityMCP plugin created successfully.")
        try:
            yield plugin
        finally:
            await plugin.cleanup()
    except Exception as e:
        LOGGER.error("Failed to create UnityMCP plugin: %s", e)
        raise
