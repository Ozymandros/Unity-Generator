"""Tests for /generate/audio endpoint."""


from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_generate_audio_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test successful audio generation."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.return_value = AgentResult(
        audio="https://example.com/audio.mp3", provider="elevenlabs"
    )

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)

    response = client.post("/generate/audio", json={"prompt": "A battle cry", "provider": "elevenlabs"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["audio"] == "https://example.com/audio.mp3"


def test_generate_audio_uses_audio_provider_preference(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that provider falls back to preferred_audio_provider."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.return_value = AgentResult(audio="url", provider="elevenlabs")

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    monkeypatch.setattr("app.main.get_pref", lambda key: "elevenlabs")

    response = client.post("/generate/audio", json={"prompt": "Test prompt"})

    assert response.status_code == 200
    call_args = mock_agent_manager.run_audio.call_args
    assert call_args[0][1] == "elevenlabs"


def test_generate_audio_error_handling(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test error response when generation fails."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.side_effect = RuntimeError("Audio agent unavailable")

    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)

    response = client.post("/generate/audio", json={"prompt": "Test prompt"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "Audio agent unavailable" in payload["error"]
