"""Tests for /generate/image endpoint."""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_generate_image_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test successful image generation."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_image.return_value = AgentResult(image="base64-data", provider="openai")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/image",
        json={"prompt": "A hero portrait", "provider": "openai"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["image"] == "base64-data"


def test_generate_image_uses_image_provider_preference(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that provider falls back to preferred_image_provider."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_image.return_value = AgentResult(image="data", provider="dalle")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    monkeypatch.setattr("app.main.get_pref", lambda key: "dalle")
    
    response = client.post(
        "/generate/image",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    call_args = mock_agent_manager.run_image.call_args
    assert call_args[0][1] == "dalle"


def test_generate_image_error_handling(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test error response when generation fails."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_image.side_effect = RuntimeError("Image agent unavailable")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/image",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "Image agent unavailable" in payload["error"]
