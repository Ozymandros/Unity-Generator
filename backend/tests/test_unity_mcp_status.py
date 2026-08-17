"""Tests for GET /api/unity-mcp/status."""

from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_unity_mcp_status_endpoint_returns_payload() -> None:
    """Status route wraps get_unity_mcp_status without exposing a tool explorer."""
    payload = {
        "available": True,
        "editor_available": False,
        "backend": "file",
        "editor_gated_warning": "Unity Editor is unavailable.",
    }
    with patch("app.routers.unity_mcp.get_unity_mcp_status", return_value=payload):
        response = client.get("/api/unity-mcp/status")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["available"] is True
    assert body["data"]["editor_available"] is False
    assert "editor_gated_warning" in body["data"]
