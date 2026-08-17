"""Tests for prompt assist and logs endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult


client = TestClient(app)


def test_prompt_assist_enhance():
    mock_result = AgentResult(content="Improved prompt text", provider="openai", model="gpt-4o-mini")
    with patch("app.routers.prompt_assist.agent_manager.run_prompt_assist", return_value=mock_result):
        response = client.post(
            "/api/prompt-assist",
            json={"prompt": "make a cube", "mode": "enhance", "provider": "openai"},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["content"] == "Improved prompt text"


def test_logs_tail_returns_lines(tmp_path):
    log_file = tmp_path / "backend.log"
    log_file.write_text("line1\nline2\nline3\n", encoding="utf-8")
    with patch("app.routers.logs.get_logs_dir", return_value=str(tmp_path)):
        response = client.get("/api/logs/tail?lines=2")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["lines"] == ["line2", "line3"]
