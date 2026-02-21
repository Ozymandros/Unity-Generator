# Unity MCP Integration with Semantic Kernel

This document describes the integration of Unity's Model Context Protocol (MCP) with Semantic Kernel using the official MCPSsePlugin, replacing legacy TCP/JSON-RPC code with a robust, maintainable, and auto-discoverable approach.

## Overview
- **No Unity/C# code required**: This integration is entirely Python-side.
- **Auto-discovery**: All Unity tools exposed by the MCP server are automatically available to Semantic Kernel.
- **No manual kernel_function decorators**: The MCPSsePlugin handles tool registration.
- **Robust error handling**: Connection and protocol errors are surfaced clearly.

## Configuration
- **Install requirements**: Ensure `semantic-kernel[mcp]` is in `backend/requirements.txt`.
- **Set MCP server command**: Configure the Unity MCP server executable via environment variables:
  - `UNITY_MCP_COMMAND`: Path to the executable (default: `unity-mcp-server`)
  - `UNITY_MCP_ARGS`: Arguments for the executable (default: empty)

Example:
```sh
export UNITY_MCP_COMMAND="C:\Path\To\UnityMcp.Server.exe"
```

## Usage
- The integration is implemented in `agents/unity_mcp_plugin.py` as `UnityMCPPluginWrapper`.
- The agent in `agents/unity_agent.py` uses this wrapper to connect and interact with Unity tools.
- All Unity automation tools (e.g., create_scene, create_script) are auto-discovered and callable from the agent.

## Error Handling
- If the Unity MCP server is unreachable, a clear error is returned and logged.
- The wrapper raises `KernelPluginInvalidConfigurationError` for connection failures.
- All protocol errors are surfaced to the caller.

## Testing
- Tests are in `backend/tests/test_unity_mcp_pluginwrapper.py`.
- Tests cover:
  - Tool auto-discovery (if server is running)
  - Error handling (server unreachable)
- Run tests with:
  ```sh
  pytest backend/tests/test_unity_mcp_pluginwrapper.py -v
  ```

## Migration Notes
- Legacy TCP/JSON-RPC code has been removed from `services/unity_mcp_client.py` and related plugins.
- All Unity tool changes/additions are now automatically available to the agent—no Python code changes required.

## References
- [Semantic Kernel MCP Plugin Documentation](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/adding-mcp-plugins)
- [Model Context Protocol (MCP) Spec](https://modelcontextprotocol.io/)

---

For further details, see the main project documentation or contact the maintainers.
