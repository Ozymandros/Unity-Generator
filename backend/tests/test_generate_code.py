"""Tests for /generate/code endpoint."""
from unittest.mock import patch, MagicMock
from app.schemas import AgentResult
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_generate_code_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test successful code generation."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_code.return_value = AgentResult(content="public class Test {}", provider="openai")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/code",
        json={"prompt": "Create a test class", "provider": "openai"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["content"] == "public class Test {}"
    mock_agent_manager.run_code.assert_called_once()


def test_generate_code_uses_preference_fallback(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that provider falls back to preference when not specified."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_code.return_value = {"content": "code"}
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    monkeypatch.setattr("app.main.get_pref", lambda key: "deepseek")
    
    response = client.post(
        "/generate/code",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    mock_agent_manager.run_code.assert_called_once()
    call_args = mock_agent_manager.run_code.call_args
    assert call_args[0][1] == "deepseek"  # provider argument


def test_generate_code_error_handling(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test error response when generation fails."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_code.side_effect = RuntimeError("Agent not available")
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/code",
        json={"prompt": "Test prompt"}
    )
    
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is False
    assert "Agent not available" in payload["error"]


def test_generate_code_with_options(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that options are passed through to agent."""
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_code.return_value = {"content": "code"}
    
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)
    
    response = client.post(
        "/generate/code",
        json={
            "prompt": "Test",
            "provider": "openai",
            "options": {"model": "gpt-4o"}
        }
    )
    
    assert response.status_code == 200
    call_args = mock_agent_manager.run_code.call_args
    assert call_args[0][2].dict()["model"] == "gpt-4o"
