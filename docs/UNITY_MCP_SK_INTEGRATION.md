# Unity MCP + Semantic Kernel Integration

## Python Integration Modes

The Python integration now supports two registration modes:

- **Expanded mode (recommended)**: each discovered MCP tool is exposed as an individual Semantic Kernel function under one plugin namespace (default: `unity`).
- **Router mode (backward compatible)**: one generic `invoke` function routes calls to a chosen MCP tool.

Expanded mode improves planner/autonomous agent tool selection because functions and parameter schemas are visible as first-class SK functions.

## Expanded Mode (Recommended)

```python
from app.agents.unity_mcp_sk.sk_integration.kernel_factory import create_kernel_with_unity_async

# client must implement list_tools() and invoke_tool(tool_name, arguments)
kernel, unity_plugin = await create_kernel_with_unity_async(
    client=my_mcp_client,
    plugin_name="unity",
    expanded_mode=True,
)

# SK now sees one plugin namespace ("unity") with many functions:
# - unity_create_scene
# - unity_add_gameobject
# - unity_create_material
# - ...
```

## Router Mode (Backward Compatible)

```python
from app.agents.unity_mcp_sk.sk_integration.kernel_factory import create_kernel_with_unity_async

kernel, unity_plugin = await create_kernel_with_unity_async(
    client=my_mcp_client,
    plugin_name="unity",
    expanded_mode=False,
)

# SK sees one function:
# unity.invoke(tool_name, arguments)
```

## Tradeoffs

- **Expanded mode**
  - Better discoverability and tool-calling reliability for planners/agents.
  - Richer per-tool metadata (name, description, required/default, type mapping).
  - Slightly larger function registry and token footprint.
- **Router mode**
  - Smallest function footprint (single generic function).
  - Weaker discoverability, often requiring stronger prompting to choose tools correctly.

## Discovery and Registration Behavior

- Tool discovery (`list_tools`) is performed once during plugin initialization.
- Registration uses the mapper's cached `get_registered_tools()` output as the source of truth.
- Tool registration order is deterministic (sorted by tool name).

## Metadata Fidelity Notes

For each MCP tool parameter, the integration preserves:

- exact parameter name,
- description,
- required/optional state,
- default value when present,
- JSON type mapping: `string`, `number`, `integer`, `boolean`, `array`, `object`.

Current Python SK limitation/workaround:

- Complex JSON Schema constructs (`oneOf`, `anyOf`, tuple schemas, advanced constraints) are passed through in `schema_data`, but SK planner behavior primarily uses simplified `KernelParameterMetadata` fields (`type_`, `is_required`, `default_value`).
