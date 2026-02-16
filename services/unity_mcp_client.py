import asyncio
import json
import logging
import uuid
from typing import Any

LOGGER = logging.getLogger(__name__)


class UnityMCPClient:
    """
    Async TCP Client for the Unity Model Context Protocol (MCP) Server.
    Handles JSON-RPC 2.0 communication over a raw TCP socket.
    """

    def __init__(self, host: str = "localhost", port: int = 8765, timeout: float = 10.0):
        self.host = host
        self.port = port
        self.timeout = timeout

    async def _send_recv(self, request: dict[str, Any]) -> dict[str, Any]:
        """
        Opens a socket, sends the request, waits for response, and closes.
        Uses asyncio for non-blocking I/O.
        """
        reader = None
        writer = None
        try:
            reader, writer = await asyncio.wait_for(asyncio.open_connection(self.host, self.port), timeout=self.timeout)

            # Format as JSON-RPC 2.0 with newline delimiter
            msg = json.dumps(request) + "\n"
            writer.write(msg.encode("utf-8"))
            await writer.drain()

            # Read response line-by-line (assuming standard JSON-RPC over TCP/NetString/Line)
            # The previous implementation assumed newline delimiter or closed connection.
            # We will read until newline.
            data = await asyncio.wait_for(reader.readline(), timeout=self.timeout)

            if not data:
                raise ConnectionError("Empty response from Unity MCP Server (Connection closed?)")

            response_str = data.decode("utf-8").strip()
            return json.loads(response_str)

        except (ConnectionRefusedError, OSError) as e:
            LOGGER.error(f"Could not connect to Unity MCP at {self.host}:{self.port}: {e}")
            raise
        except json.JSONDecodeError as e:
            LOGGER.error(f"Invalid JSON from Unity MCP: {e}")
            raise
        finally:
            if writer:
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:
                    pass

    async def send_request(self, method: str, params: dict[str, Any] | None = None) -> Any:
        """
        Sends a JSON-RPC request to the Unity MCP server.
        """
        request_id = str(uuid.uuid4())
        payload = {"jsonrpc": "2.0", "id": request_id, "method": method, "params": params or {}}

        LOGGER.debug(f"Sending Unity MCP Request: {method} {params}")
        response = await self._send_recv(payload)
        LOGGER.debug(f"Received Unity MCP Response: {response}")

        if "error" in response:
            error = response["error"]
            code = error.get("code", "Unknown")
            msg = error.get("message", "Unknown Error")
            raise RuntimeError(f"Unity MCP Error ({code}): {msg}")

        return response.get("result")

    async def ping(self) -> str:
        return await self.send_request("ping")
