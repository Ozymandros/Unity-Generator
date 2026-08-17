"""Optional live smoke tests for unity-mcp. Skipped unless UNITY_MCP_LIVE_SMOKE=1."""

from __future__ import annotations

import os
import shutil

import pytest


pytestmark = pytest.mark.skipif(
    os.environ.get("UNITY_MCP_LIVE_SMOKE", "").strip() not in ("1", "true", "yes")
    or shutil.which("unity-mcp") is None,
    reason="Live smoke requires UNITY_MCP_LIVE_SMOKE=1 and unity-mcp on PATH",
)


@pytest.mark.asyncio
async def test_live_ping_and_capabilities() -> None:
    """Ping the real unity-mcp process and load unity_get_capabilities."""
    from app.agents.unity_mcp_plugin import create_unity_mcp_plugin

    async with create_unity_mcp_plugin() as plugin:
        ping = await plugin.invoke_tool("ping", {})
        assert "pong" in str(ping).lower() or ping
        caps = await plugin.invoke_tool("unity_get_capabilities", {})
        text = str(caps)
        assert "backend" in text or "capabilities" in text
