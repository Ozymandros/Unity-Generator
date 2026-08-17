"""Tests for the official MCP SDK adapter used by Semantic Kernel agents."""

from __future__ import annotations

import pytest

from app.services.unity_mcp_sdk_client import OfficialMcpSdkClient, _parse_tool_content


class _FakeText:
    def __init__(self, text: str) -> None:
        self.text = text


class _FakeResult:
    def __init__(self, *, text: str, is_error: bool = False) -> None:
        self.content = [_FakeText(text)]
        self.isError = is_error


def test_parse_tool_content_parses_json() -> None:
    """Tool text payloads should deserialize to Python values when JSON."""
    import app.services.unity_mcp_sdk_client as module

    original = module.TextContent
    module.TextContent = _FakeText
    try:
        parsed = _parse_tool_content(_FakeResult(text='{"success": true, "items": [1]}'))
    finally:
        module.TextContent = original

    assert parsed == {"success": True, "items": [1]}


@pytest.mark.asyncio
@pytest.mark.live_mcp
async def test_sdk_client_invokes_list_assets_live() -> None:
    """Live smoke: official SDK client can call a tool the legacy client rejects."""
    from unity_mcp.models import UnityMcpOptions

    client = OfficialMcpSdkClient(UnityMcpOptions(executable_path="unity-mcp"))
    await client.connect()
    try:
        tools = await client.list_tools()
        names = {tool.name for tool in tools}
        assert "unity_list_assets" in names

        response = await client.invoke_tool(
            "unity_list_assets",
            {"projectPath": "C:/output/UnityProject1", "folderName": "Assets"},
        )
        assert response.success is True
        assert response.result is not None
    finally:
        await client.close()
