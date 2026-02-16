

import os
from typing import Optional
from semantic_kernel.connectors.mcp import MCPSsePlugin

class UnityMCPPluginWrapper:
    """
    Wrapper for Semantic Kernel's MCPSsePlugin to connect to Unity MCP server via SSE.
    """
    def __init__(self, url: Optional[str] = None):
        # Allow configuration via env var UNITY_MCP_URL
        self.url = url or os.environ.get("UNITY_MCP_URL", "http://localhost:8080")
        self._plugin = None

    async def initialize(self):
        """Initialize and connect the MCP plugin."""
        self._plugin = MCPSsePlugin(
            name="UnityMCP",
            description="Unity Editor automation tools via MCP",
            url=self.url,
            load_tools=True,
            load_prompts=False,
            request_timeout=30
        )
        await self._plugin.connect()
        return self._plugin

    async def close(self):
        if self._plugin:
            await self._plugin.close()
