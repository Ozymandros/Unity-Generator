# Unity MCP + Semantic Kernel Integration (Python)

> **Install/configure the Unity MCP *server* (Git URL, env vars):** [UNITY_MCP_SERVER.md](./UNITY_MCP_SERVER.md).

This project relies on the **`unity-mcp-plugin`** Python package for Semantic Kernel integration. Source lives in **[unity-mcp-server-plugin](https://github.com/Ozymandros/unity-mcp-server-plugin)** (import `unity_mcp`). That plugin is a **stdio client** of **[Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** 3.2.1 (~89 tools). The C# NuGet **Unity-MCP-SK-Plugin** is a separate host and is **not** loaded by this app.

| Piece | Repository |
|-------|------------|
| MCP server (tools, Unity contract, stdio only) | [github.com/Ozymandros/Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server) |
| Python SK plugin (`unity_mcp` package) | [github.com/Ozymandros/unity-mcp-server-plugin](https://github.com/Ozymandros/unity-mcp-server-plugin) |

**Dependency:** `backend/requirements.txt` pins **`unity-mcp-plugin`** to the sibling checkout (`file:../../unity-mcp-server-plugin`). After a git tag exists, switch to `git+https://github.com/Ozymandros/unity-mcp-server-plugin.git@<tag>`.

## Typed skills (recommended)

```python
from semantic_kernel import Kernel
from unity_mcp import UnityMCPPlugin, add_unity_mcp_skills

plugin = UnityMCPPlugin.create()
await plugin.initialize()
kernel = Kernel()
add_unity_mcp_skills(kernel, plugin)
result = await kernel.invoke(
    "scene",
    "unity_create_scene",
    projectPath="C:/MyProj",
    fileName="Assets/Scenes/Main.unity",
)
```

Typed namespaces: `server`, `project`, `scene`, `asset`, `packages`, `validation`, `ecosystem`, `camera`, `light`, `physics`, `ui`, `nav`, `input`, `animation`, `vfx`, `component`, `editor_bridge`.

Call `unity_get_capabilities` before Editor-gated tools. Discovery/`invoke_unity_tool` remain as fallback for unknown server tools.

## Expanded Mode (discovery fallback)

```python
from unity_mcp import UnityMCPPlugin

# Discovers MCP tools and registers them as individual SK functions
# under one plugin namespace ("unity" by default).
kernel = await UnityMCPPlugin.create_kernel_with_unity(plugin_name="unity")

# Example invocation:
result = await kernel.invoke("unity", "unity_create_scene", projectPath="C:/MyProj", fileName="Assets/Scenes/Main.unity")
```

## Router Mode (Backward Compatible)

```python
from semantic_kernel import Kernel
from unity_mcp import UnityMCPPlugin

plugin = UnityMCPPlugin.create()
await plugin.initialize()

kernel = Kernel()
kernel.add_plugin(plugin, plugin_name="unity")

result = await kernel.invoke(
    "unity",
    "invoke_unity_tool",
    tool_name="unity_create_scene",
    arguments_json='{"projectPath":"C:/MyProj","fileName":"Assets/Scenes/Main.unity"}',
)
```

## Tradeoffs

- **Expanded mode**: better discoverability and more reliable autonomous tool calling.
- **Router mode**: smaller tool-definition footprint but weaker discoverability.

## Metadata Fidelity

The `unity-mcp-plugin` package maps MCP tool schemas into SK metadata (parameter name, description, required/default, and base JSON types: `string`, `number`, `integer`, `boolean`, `array`, `object`).

Python SK limitation: advanced JSON Schema constructs are partially surfaced (typically via schema metadata) but not always fully interpreted as first-class planner constraints.

## Router / parameter safety

Older in-repo experiments under `backend/app/agents/unity_mcp_sk/` (removed) duplicated router logic; that path no longer exists here. The canonical implementation lives in the `unity-mcp-plugin` package: expanded-mode handlers only forward kwargs whose names match the MCP tool schema, and `invoke_unity_tool` strips `tool_name` / `toolName` from parsed JSON so they are never sent as MCP parameters.
