"""Tests for /generate/audio endpoint."""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_generate_audio_success(client, monkeypatch):
    """Test successful audio generation."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.return_value = {"audio_url": "https://example.com/audio.mp3"}
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/audio",
        json={"prompt": "A battle cry", "provider": "elevenlabs"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "audio_url" in payload["data"]


def test_generate_audio_uses_audio_provider_preference(client, monkeypatch):
    """Test that provider falls back to preferred_audio_provider."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.return_value = {"audio_url": "url"}
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    monkeypatch.setattr("app.main.get_pref", lambda key: "elevenlabs")
    
    response = client.post(
        "/generate/audio",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    call_args = mock_agent_manager.run_audio.call_args
    assert call_args[0][1] == "elevenlabs"


def test_generate_audio_error_handling(client, monkeypatch):
    """Test error response when generation fails."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_audio.side_effect = RuntimeError("Audio agent unavailable")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/audio",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "Audio agent unavailable" in payload["error"]
