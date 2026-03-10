# Integrating Unity-MCP with Semantic Kernel (SK) in .NET 10

## Overview
To connect your existing Unity-MCP server to Semantic Kernel (SK), you do **not** need to rewrite the server or create a separate plugin project. Instead, use the official MCP connector package for SK, which allows the kernel to discover and use your MCP tools automatically.

## Steps

### 1. Install the MCP Connector Package

```sh
dotnet add package Microsoft.SemanticKernel.Connectors.Mcp
```

### 2. Register the MCP Server as a Plugin in SK

```csharp
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.Mcp;

var builder = Kernel.CreateBuilder();

// Register the global unity-mcp tool via Stdio
var mcpPlugin = new McpStdioPlugin(
    "UnityManager", 
    "unity-mcp" // The global tool name
);

builder.Plugins.Add(mcpPlugin);
var kernel = builder.Build();

// Example: Call a tool
var result = await kernel.InvokeAsync("UnityManager", "create_scene", new() {
    ["name"] = "MainScene"
});
```

### 3. How It Works
- The MCP server is a global tool (e.g., `unity-mcp`) and is discovered automatically.
- The connector queries the MCP server for available tools and exposes them as KernelFunctions.
- No .json/.yaml plugin project or manual tool registration is needed.

### 4. Best Practices
- Ensure `unity-mcp` is installed and available in your system PATH.
- Use the latest version of the connector for .NET 10 compatibility.
- Tool descriptions and parameters from MCP are surfaced in SK automatically.

---

**Summary:**
- No plugin project required.
- Use the official connector package.
- Register your MCP server as shown above.
- All MCP tools become available in SK with no extra configuration.
