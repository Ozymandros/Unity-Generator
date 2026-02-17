"""
Tests for AgentManager system-prompt fallback logic.

Verifies that ``run_unity`` uses ``get_pref`` when no explicit system
prompt is provided, and skips it when one is.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agent_manager import AgentManager


@pytest.mark.asyncio
async def test_run_unity_fallback_system_prompt() -> None:
    """run_unity should read default_code_system_prompt when none is given."""
    with patch("app.agent_manager.get_pref") as mock_get_pref, \
         patch("app.agent_manager.load_api_keys", return_value={}):
        mock_get_pref.return_value = "Default System Prompt"

        manager = AgentManager()
        manager.unity_agent = MagicMock()
        manager.unity_agent.run = AsyncMock(return_value={"content": "result", "provider": "test"})

        await manager.run_unity(
            prompt="Test Prompt",
            provider="test-provider",
            options={},
        )

        mock_get_pref.assert_called_with("default_code_system_prompt")

        call_args = manager.unity_agent.run.call_args
        assert call_args[0][4] == "Default System Prompt"


@pytest.mark.asyncio
async def test_run_unity_explicit_system_prompt() -> None:
    """run_unity should skip get_pref when an explicit system prompt is provided."""
    with patch("app.agent_manager.get_pref") as mock_get_pref, \
         patch("app.agent_manager.load_api_keys", return_value={}):

        manager = AgentManager()
        manager.unity_agent = MagicMock()
        manager.unity_agent.run = AsyncMock(return_value={"content": "result", "provider": "test"})

        await manager.run_unity(
            prompt="Test Prompt",
            provider="test-provider",
            options={},
            system_prompt="Explicit System Prompt",
        )

        mock_get_pref.assert_not_called()

        call_args = manager.unity_agent.run.call_args
        assert call_args[0][4] == "Explicit System Prompt"
