import pytest


# When re-enabling: update tests to match the new Unity-MCP-Server contract
# (projectPath + fileName/folderName on file/scene/asset tools, ping with no args).
@pytest.mark.skip(reason="UnityMCPPlugin no longer exists in agents/unity_mcp_plugin.py")
class TestUnityMCP:
    pass
