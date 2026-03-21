"""
Semantic Kernel integration for Unity MCP tools.

This package supports two registration modes:
- Expanded mode: one SK function per MCP tool (recommended).
- Router mode: one generic SK function for tool routing.
"""

from .plugin.unity_mcp_semantic_plugin import UnityMcpSemanticPlugin
from .sk_integration.kernel_factory import create_kernel_with_unity_async
from .sk_integration.kernel_registration import register_unity_router_function, register_unity_tools_as_functions

__all__ = [
    "UnityMcpSemanticPlugin",
    "create_kernel_with_unity_async",
    "register_unity_router_function",
    "register_unity_tools_as_functions",
]

