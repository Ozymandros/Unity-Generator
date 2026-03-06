import pytest


# When re-enabling: update tests to match the new Unity-MCP-Server contract
# (projectPath + fileName/folderName on tools, ping with no args).
@pytest.mark.skip(reason="MCPToolSchema and old plugin structure no longer exist")
async def test_kernel_unity_mcp_integration():
    pass

@pytest.mark.skip(reason="MCPToolSchema and old plugin structure no longer exist")
async def test_kernel_create_gameobject_e2e():
    pass
