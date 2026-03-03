import pytest


# When re-enabling: update tests to match the new Unity-MCP-Server contract
# (projectPath + fileName/folderName on tools, ping with no args).
@pytest.mark.skip(reason="Requires running MCP server or better mocking of async connection")
@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_connect_and_discover(monkeypatch):
    pass

@pytest.mark.skip(reason="Requires running MCP server or better mocking of async connection")
@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_error(monkeypatch):
    pass
