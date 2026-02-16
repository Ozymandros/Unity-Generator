import asyncio
import json
import os
import socket
import sys
import threading
from unittest.mock import MagicMock

# Add backend directory to path so that 'services' and 'app' imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest

from agents.unity_mcp_plugin import UnityMCPPlugin
from services.unity_mcp_client import UnityMCPClient


# Mock Server for TCP testing
def start_mock_server(port=8765, responses=None):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(("localhost", port))
    server.listen(1)

    def handle_client():
        conn, _ = server.accept()
        while True:
            data = conn.recv(1024)
            if not data:
                break

            # Simple JSON-RPC response
            # Implementation note: The client now expects a newline delimiter
            # and potentially sends a newline.
            # We need to handle that in the mock.
            try:
                request = json.loads(data.decode().strip())
                method = request.get("method")

                response = {"jsonrpc": "2.0", "id": request.get("id"), "result": f"Executed {method}"}

                if responses and method in responses:
                    response["result"] = responses[method]

                conn.sendall((json.dumps(response) + "\n").encode())
            except Exception:
                pass
            break  # Close after one request for simplicity
        conn.close()
        server.close()

    thread = threading.Thread(target=handle_client)
    thread.start()
    return thread


@pytest.mark.asyncio
class TestUnityMCP:
    async def test_client_send_request(self):
        # We'll mock the internal _send_recv instead of socket directly
        # because mocking asyncio.open_connection is verbose
        client = UnityMCPClient()
        client._send_recv = MagicMock(return_value={"result": "pong"})

        # Async mock requires await, but MagicMock isn't awaitable by default.
        # We need an AsyncMock.
        future = asyncio.Future()
        future.set_result({"result": "pong"})
        client._send_recv = MagicMock(return_value=future)

        result = await client.ping()

        assert result == "pong"

    async def test_plugin_wrappers(self):
        # Test that plugin methods call client correctly
        plugin = UnityMCPPlugin()
        plugin.client = MagicMock()

        future = asyncio.Future()
        future.set_result("Success")
        plugin.client.send_request.return_value = future

        assert "Success" in await plugin.create_scene("Assets/Test.unity")
        plugin.client.send_request.assert_called_with("unity_create_scene", {"path": "Assets/Test.unity"})

    async def test_plugin_list_assets(self):
        plugin = UnityMCPPlugin()
        plugin.client = MagicMock()

        future = asyncio.Future()
        future.set_result(["file1", "file2"])
        plugin.client.send_request.return_value = future

        result = await plugin.list_assets()
        assert "file1" in result
        assert "file2" in result


if __name__ == "__main__":
    pytest.main([__file__])
