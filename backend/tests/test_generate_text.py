"""Tests for /generate/text endpoint."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_generate_text_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test successful text generation."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_text.return_value = AgentResult(content="Hello, world!", provider="openai")

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)

    response = client.post("/generate/text", json={"prompt": "Say hello", "provider": "openai"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["content"] == "Hello, world!"


def test_generate_text_uses_preference_fallback(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that provider falls back to preference when not specified."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_text.return_value = AgentResult(content="text", provider="groq")

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    monkeypatch.setattr("app.main.get_pref", lambda key: "groq")

    response = client.post("/generate/text", json={"prompt": "Test prompt"})

    assert response.status_code == 200
    call_args = mock_agent_manager.run_text.call_args
    assert call_args[0][1] == "groq"


def test_generate_text_error_handling(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test error response when generation fails."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_text.side_effect = RuntimeError("Text agent unavailable")

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)

    response = client.post("/generate/text", json={"prompt": "Test prompt"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "Text agent unavailable" in payload["error"]
