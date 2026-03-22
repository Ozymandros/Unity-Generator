# Unity MCP + Semantic Kernel Integration (Python)

> **Install/configure the Unity MCP *server* (Git URL, env vars):** [UNITY_MCP_SERVER.md](./UNITY_MCP_SERVER.md).

This project relies on the **`unity-mcp-plugin`** Python package for Semantic Kernel integration. Source and releases live in **[Unity-MCP-SK-Plugin](https://github.com/Ozymandros/Unity-MCP-SK-Plugin)**. That plugin is a **client** of the MCP server **[Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)** (stdio): you must have the server executable available (e.g. `unity-mcp` on `PATH`) or set `UNITY_MCP_COMMAND` (see [UNITY_MCP_INTEGRATION.md](./UNITY_MCP_INTEGRATION.md)).

| Piece | Repository |
|-------|------------|
| MCP server (tools, Unity contract) | [github.com/Ozymandros/Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server) |
| Python SK plugin (`unity_mcp` package) | [github.com/Ozymandros/Unity-MCP-SK-Plugin](https://github.com/Ozymandros/Unity-MCP-SK-Plugin) |

**Dependency:** `backend/requirements.txt` documents two ways to get **`unity-mcp-plugin`**: **Git URL** (no sibling folder) or **`-e ../unity-mcp-server-plugin`** (default sibling clone). Use **SSH** or a fork if the GitHub repo is private. For hacking the bridge, clone that repo anywhere and use `pip install -e <path>`.

## Expanded Mode (Recommended)

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
