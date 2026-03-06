"""
Tests for AgentManager system-prompt fallback logic.

Verifies that ``run_unity`` uses ``get_pref`` when no explicit system
prompt is provided, and skips it when one is.
"""
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

from app.services.agent_manager import AgentManager


@pytest.mark.asyncio
@patch("app.repositories.get_api_key_repo")
@patch("app.repositories.get_system_prompt_repo")
async def test_run_unity_fallback_system_prompt(mock_get_prompt_repo, mock_get_key_repo) -> None:
    """run_unity should read default_code_system_prompt when none is given."""
    mock_get_key_repo.return_value.get_all.return_value = {}
    mock_get_prompt_repo.return_value.get.return_value = "Default System Prompt"

    manager = AgentManager()
    with patch("app.agents.unity_agent.UnityAgent.run", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = {"content": "result", "provider": "test"}
        await manager.run_unity(
            prompt="Test Prompt",
            provider="openai",
            options={"model": "gpt-4o"},
        )

        mock_get_prompt_repo.return_value.get.assert_called_with("code")
        # Check the system_prompt (5th) and project_path (6th) arguments
        args, _ = mock_run.call_args
        assert args[4] == "Default System Prompt"
        assert args[5] is None  # project_path not passed


@pytest.mark.asyncio
@patch("app.repositories.get_api_key_repo")
@patch("app.repositories.get_system_prompt_repo")
async def test_run_unity_explicit_system_prompt(mock_get_prompt_repo, mock_get_key_repo) -> None:
    """run_unity should skip get_pref when an explicit system prompt is provided."""
    mock_get_key_repo.return_value.get_all.return_value = {}
    # The return value for get_system_prompt_repo.get doesn't matter here
    # as it should not be called. We can set a default or leave it as a MagicMock.
    # Setting it to a default for consistency, though assert_not_called is the key.
    mock_get_prompt_repo.return_value.get.return_value = "Default System Prompt"

    manager = AgentManager()
    with patch("app.agents.unity_agent.UnityAgent.run", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = {"content": "result", "provider": "test"}
        await manager.run_unity(
            prompt="Test Prompt",
            provider="openai",
            options={"model": "gpt-4o"},
            system_prompt="Explicit System Prompt",
        )

        mock_get_prompt_repo.return_value.get.assert_not_called()

        args, _ = mock_run.call_args
        assert args[4] == "Explicit System Prompt"
        assert args[5] is None  # project_path not passed
