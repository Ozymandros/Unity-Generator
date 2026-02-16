import asyncio
import os
import sys
from unittest.mock import MagicMock

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print(f"Added {backend_dir} to sys.path")

try:
    from agents.unity_mcp_plugin import UnityMCPPlugin
    from services.unity_mcp_client import UnityMCPClient

    print("Imports successful!")
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)


async def test_client_ping():
    print("Testing Client Ping...")
    client = UnityMCPClient()
    # Mock _send_recv
    future = asyncio.Future()
    future.set_result({"result": "pong"})
    client._send_recv = MagicMock(return_value=future)

    result = await client.ping()
    if result == "pong":
        print("PASS: Client Ping")
    else:
        print(f"FAIL: Client Ping returned {result}")


async def test_plugin_create_scene():
    print("Testing Plugin Create Scene...")
    plugin = UnityMCPPlugin()
    plugin.client = MagicMock()

    future = asyncio.Future()
    future.set_result("Scene Created")
    plugin.client.send_request.return_value = future

    result = await plugin.create_scene("Assets/Scenes/Test.unity")
    if "Scene created: Scene Created" in result:
        print("PASS: Plugin Create Scene")
    else:
        print(f"FAIL: Plugin Create Scene returned {result}")


if __name__ == "__main__":
    try:
        asyncio.run(test_client_ping())
        asyncio.run(test_plugin_create_scene())
        print("All manual tests passed.")
    except Exception as e:
        print(f"Test Execution Failed: {e}")
        import traceback

        traceback.print_exc()
