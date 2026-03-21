"""Convenience kernel factory for Unity MCP Semantic Kernel integration."""

from __future__ import annotations

from semantic_kernel import Kernel

from ..core.contracts import McpToolClient
from ..plugin.unity_mcp_semantic_plugin import UnityMcpSemanticPlugin
from .kernel_registration import register_unity_router_function, register_unity_tools_as_functions


async def create_kernel_with_unity_async(
    client: McpToolClient,
    *,
    plugin_name: str = "unity",
    expanded_mode: bool = True,
) -> tuple[Kernel, UnityMcpSemanticPlugin]:
    """
    Create an SK kernel with Unity MCP integration.

    Args:
        client: MCP client used for discovery and invocation.
        plugin_name: SK plugin namespace for Unity functions.
        expanded_mode: True to register one function per tool (recommended),
            False to keep router mode with a single invoke function.

    Returns:
        Tuple of configured kernel and initialized Unity MCP plugin runtime.

    Raises:
        ValueError: If inputs are invalid.

    Example:
        >>> # doctest: +SKIP
        >>> kernel, unity_plugin = await create_kernel_with_unity_async(client, expanded_mode=True)
    """
    if client is None:
        raise ValueError("client must not be None.")
    if not plugin_name or not isinstance(plugin_name, str):
        raise ValueError("plugin_name must be a non-empty string.")

    unity_plugin = UnityMcpSemanticPlugin(client=client)
    await unity_plugin.initialize()

    kernel = Kernel()
    if expanded_mode:
        register_unity_tools_as_functions(kernel=kernel, plugin=unity_plugin, plugin_name=plugin_name)
    else:
        register_unity_router_function(kernel=kernel, plugin=unity_plugin, plugin_name=plugin_name)

    return kernel, unity_plugin

