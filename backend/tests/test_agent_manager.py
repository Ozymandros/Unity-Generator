"""Tests for agent_manager module."""
from unittest.mock import MagicMock, patch
import sys

import pytest

from app.agent_manager import AgentManager


def test_agent_manager_init_without_agents(monkeypatch):
    """Test AgentManager initializes gracefully when agents module missing."""
    # Ensure 'agents' is not loadable
    monkeypatch.setattr("sys.path", [])
    
    with patch.dict(sys.modules, {"agents": None}):
        manager = AgentManager()
        assert manager.code_agent is None
        assert manager.text_agent is None
        assert manager.image_agent is None
        assert manager.audio_agent is None


def test_run_code_raises_when_agent_unavailable():
    """Test run_code raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.code_agent = None
    
    with pytest.raises(RuntimeError, match="CodeAgent is not available"):
        manager.run_code("prompt", "provider", {})


def test_run_text_raises_when_agent_unavailable():
    """Test run_text raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.text_agent = None
    
    with pytest.raises(RuntimeError, match="TextAgent is not available"):
        manager.run_text("prompt", "provider", {})


def test_run_image_raises_when_agent_unavailable():
    """Test run_image raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.image_agent = None
    
    with pytest.raises(RuntimeError, match="ImageAgent is not available"):
        manager.run_image("prompt", "provider", {})


def test_run_audio_raises_when_agent_unavailable():
    """Test run_audio raises RuntimeError when agent is None."""
    manager = AgentManager()
    manager.audio_agent = None
    
    with pytest.raises(RuntimeError, match="AudioAgent is not available"):
        manager.run_audio("prompt", "provider", {})


def test_run_code_calls_agent_run(tmp_path, monkeypatch):
    """Test run_code calls agent.run with correct parameters."""
    from app import config
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)
    
    # Create mock config file
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "api_keys.json").write_text('{"openai_api_key": "sk-test"}')
    
    mock_agent = MagicMock()
    mock_agent.run.return_value = {"content": "test"}
    
    manager = AgentManager()
    manager.code_agent = mock_agent
    
    result = manager.run_code("test prompt", "openai", {"model": "gpt-4o"})
    
    mock_agent.run.assert_called_once_with(
        "test prompt",
        "openai",
        {"model": "gpt-4o"},
        {"openai_api_key": "sk-test"}
    )
    assert result == {"content": "test"}
