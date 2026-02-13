"""Tests for agent_manager module."""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.agent_manager import AgentManager


def test_agent_manager_init(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test AgentManager initializes gracefully when agents module missing."""
    # Ensure 'agents' is not loadable
    monkeypatch.setattr("sys.path", [])

    with patch.dict(sys.modules, {"agents": None}):
        manager = AgentManager()
        assert manager.code_agent is None
        assert manager.text_agent is None
        assert manager.image_agent is None
        assert manager.audio_agent is None


def test_run_code_raises_when_agent_unavailable() -> None:
    """Test run_code raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.code_agent = None

    with pytest.raises(RuntimeError, match="CodeAgent is not available"):
        manager.run_code("prompt", "provider", {})


def test_run_text_raises_when_agent_unavailable() -> None:
    """Test run_text raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.text_agent = None

    with pytest.raises(RuntimeError, match="TextAgent is not available"):
        manager.run_text("prompt", "provider", {})


def test_run_image_raises_when_agent_unavailable() -> None:
    """Test run_image raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.image_agent = None

    with pytest.raises(RuntimeError, match="ImageAgent is not available"):
        manager.run_image("prompt", "provider", {})


def test_run_audio_raises_when_agent_unavailable() -> None:
    """Test run_audio raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.audio_agent = None

    with pytest.raises(RuntimeError, match="AudioAgent is not available"):
        manager.run_audio("prompt", "provider", {})


@pytest.fixture
def mock_agent_manager() -> MagicMock:
    """Fixture for a mock AgentManager."""
    return MagicMock(spec=AgentManager)


def test_agent_manager_run_code(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Test run_code calls agent.run with correct parameters."""
    from app import config

    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    # Create mock config file
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "api_keys.json").write_text('{"openai_api_key": "sk-test"}')

    mock_agent = MagicMock()
    mock_agent.run.return_value = {"content": "test", "provider": "openai"}

    manager = AgentManager()
    manager.code_agent = mock_agent

    monkeypatch.setattr("app.agent_manager.get_pref", lambda k: None)

    result = manager.run_code("test prompt", "openai", {"model": "gpt-4o"})

    mock_agent.run.assert_called_once_with(
        "test prompt", "openai", {"model": "gpt-4o"}, {"openai_api_key": "sk-test"}, None
    )
    assert result.content == "test"
