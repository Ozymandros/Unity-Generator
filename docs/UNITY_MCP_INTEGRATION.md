# Unity MCP Integration with Semantic Kernel

> **Unity MCP Server (install, Git URL, env vars — not the Python plugin):** see **[UNITY_MCP_SERVER.md](./UNITY_MCP_SERVER.md)**.

This document describes the integration of Unity's Model Context Protocol (MCP) with Semantic Kernel using the Python **`unity-mcp-plugin`** package from **[unity-mcp-server-plugin](https://github.com/Ozymandros/unity-mcp-server-plugin)** (pinned in `backend/requirements.txt`). The backend talks to **Unity MCP Server 3.2.1** over **stdio only**. The C# NuGet Unity-MCP-SK-Plugin is a different host and is not loaded here.

## Required dependencies (two repositories)

| Component | Purpose | GitHub repository | How this project uses it |
|-----------|---------|-------------------|----------------------------|
| **Unity-MCP-Server** | Official MCP server that exposes Unity Editor automation tools (JSON-RPC over stdio when used as a global .NET tool). | **[github.com/Ozymandros/Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** | Install and run the `unity-mcp` global tool (or your built server executable). Point `UNITY_MCP_COMMAND` at that executable if it is not on `PATH`. |
| **unity-mcp-plugin** (Python distribution) | Semantic Kernel bridge: typed domain skills + discovery fallback. | **[github.com/Ozymandros/unity-mcp-server-plugin](https://github.com/Ozymandros/unity-mcp-server-plugin)** | `backend/requirements.txt` pins a local/git ref. Imported as `from unity_mcp import UnityMCPPlugin, add_unity_mcp_skills`. |

**Install order (typical dev setup):**

1. Clone **[Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** and install the server per its README (often a global .NET tool named `unity-mcp` on your `PATH`; follow that repo’s install script or `dotnet tool` instructions).
2. Install **`unity-mcp-plugin`**: either follow the **default** in `backend/requirements.txt` (sibling clone + `-e`), **or** comment that out and use **`unity-mcp-plugin @ git+ssh://...`** (or your fork) so the app does not depend on a fixed folder next to this repo. If `git+https` fails with **404**, the GitHub repo is likely **private**—use SSH, a public fork, or a wheel.

**Optional dev workflow:** clone **unity-mcp-server-plugin** next to this repo and use `pip install -e /path/to/unity-mcp-server-plugin` while developing the Python bridge. The C# NuGet **Unity-MCP-SK-Plugin** is a different host and is not loaded here.

## Path terminology (don’t confuse these)

- **Unity project path**: The **root folder of the Unity project** that contains an `Assets/` folder (e.g. `C:/Projects/Unity-Generator/output/MyGame`). This is the path you set in the app (session/project name and path) and that the backend injects into the agent so MCP tools know which project to operate on. **This is not** the MCP server executable or a NuGet package path.
- **Unity MCP Server**: The **stdio executable** (`unity-mcp`) that exposes MCP tools. Configure how the backend reaches it via `UNITY_MCP_COMMAND` (path to the **server executable**) or by having `unity-mcp` on PATH. A path like `c:\...\UnityMcp.Server\nupkg` is the **NuGet package output** for the MCP server, not a Unity project path—never use that as the project path. Editor-gated tools still require a live Unity Editor; call `unity_get_capabilities` first.

## Overview
- **No Unity/C# code required**: This integration is entirely Python-side.
- **Typed skills**: `add_unity_mcp_skills` registers ~89 camelCase MCP tools as SK functions (`projectPath`/`fileName`).
- **Discovery fallback**: unknown server tools still register; `invoke_unity_tool` remains.
- **No Streamable HTTP** for the current upstream Unity-MCP-Server.
- **Robust error handling**: Connection and protocol errors are surfaced clearly.

## Configuration
- **Install requirements**: Ensure `backend/requirements.txt` installs **`unity-mcp-plugin`** (see comments in that file: Git URL vs `-e` sibling path).
- **Set MCP server command** (this is the **Unity MCP Server executable**, not a Unity project path):
  - `UNITY_MCP_COMMAND`: Path to the MCP server executable (default: `unity-mcp`)
  - `UNITY_MCP_ARGS`: Arguments for the executable (default: empty)

Example (path to the **server executable**, not to a Unity project):
```sh
export UNITY_MCP_COMMAND="C:\Path\To\UnityMcp.Server.exe"
```

## Usage
- The integration is implemented in `backend/app/agents/unity_mcp_plugin.py` using `unity_mcp.UnityMCPPlugin` from the **`unity-mcp-plugin`** package.
- The agent in `backend/app/agents/unity_agent.py` uses this wrapper to connect and interact with Unity tools.
- Typed skills register the ~89 camelCase tools (e.g. `unity_create_scene`, `unity_save_script`). Unknown tools remain available via discovery/`invoke_unity_tool`.

### Requirements for scene creation (assets in Unity)
- **Tool-use provider**: The LLM provider used for scene creation must support **tool use** (e.g. OpenAI, DeepSeek, Google, Groq). If the provider does not support tool use, the MCP plugin is not registered and the agent cannot call Unity MCP tools—so no scenes or GameObjects are created in the Editor. Check provider capabilities in Settings; providers like Replicate may have tool use disabled.
- **Unity MCP server**: `unity-mcp` must be on PATH (or `UNITY_MCP_COMMAND` must point at the stdio executable) so the agent can invoke tools such as `unity_create_scene`, `unity_add_gameobject`, and `unity_save_script`. Call `unity_get_capabilities` before Editor-gated tools. Never pass `path`, `scenePath`, or unprefixed names such as `create_scene`.

### Project path injection
- **Project path** comes from **session storage** (ProjectName; keys: `unity_session_project_name`, `unity_session_project_path`). The sidebar shows an editable project name; the path is set when you generate or finalize a project in the Unity Project panel.
- **Base path** (where projects are created) is **relative** by default (`./output`) and **customizable** in the Settings panel; it is stored in the DB as `output_base_path`.
- When you create a scene via **Scenes** panel, the frontend sends `project_path` in the request body when the session path is set. The backend resolves the path as: request `project_path` → preference `active_unity_project_path` → latest project path under the base path.
- The scenes router passes the resolved path to the Unity agent. The agent **normalizes** the path to forward slashes (for MCP contract) and **injects** it into the system prompt so the model can use it when calling MCP tools that require a project path (e.g. save_* or contract tools). Paths are normalized so the MCP server receives consistent values.
- For **code, text, image, audio, and sprites**, the frontend sends `project_path` when "Save to project" is enabled, using the store path or the session path as fallback so assets can be written to the active Unity project.

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
- **[Unity MCP Server — install & config in this repo](./UNITY_MCP_SERVER.md)** (Git URLs, `UNITY_MCP_COMMAND`, file locations)
- [Unity-MCP-Server (GitHub)](https://github.com/Ozymandros/Unity-MCP-Server)
- [Unity-MCP-SK-Plugin / unity-mcp-plugin (GitHub)](https://github.com/Ozymandros/Unity-MCP-SK-Plugin)
- [Semantic Kernel — MCP plugins](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/adding-mcp-plugins)
- [Model Context Protocol (MCP) spec](https://modelcontextprotocol.io/)

---

For further details, see the main project documentation or contact the maintainers.
