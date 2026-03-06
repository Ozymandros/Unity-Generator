// .NET 10 Semantic Kernel + Unity-MCP integration sample
// Place this in your SK orchestration project

using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.Mcp;

var builder = Kernel.CreateBuilder();

// Register the MCP server as a plugin (ensure 'unity-mcp' is globally installed)
var mcpPlugin = new McpStdioPlugin(
    "UnityManager", // Plugin name in SK
    "unity-mcp"     // Global tool name
);
builder.Plugins.Add(mcpPlugin);

var kernel = builder.Build();

// Example: Call a tool from MCP
var result = await kernel.InvokeAsync("UnityManager", "create_scene", new() {
    ["name"] = "MainScene"
});

Console.WriteLine(result);