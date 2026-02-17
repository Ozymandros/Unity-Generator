from unittest.mock import MagicMock, patch
import pytest
from app.agent_manager import AgentManager, AgentResult

@pytest.mark.asyncio
async def test_run_unity_fallback_system_prompt():
    # Mock UnityAgent
    with patch("app.agent_manager.UnityAgent") as MockUnityAgent:
        # Mock get_pref
        with patch("app.agent_manager.get_pref") as mock_get_pref:
            mock_get_pref.return_value = "Default System Prompt"
            
            # Setup
            manager = AgentManager()
            manager.unity_agent = MagicMock()
            manager.unity_agent.run = MagicMock()
            async def mock_run(*args, **kwargs):
                return {"content": "result"}
            manager.unity_agent.run.side_effect = mock_run

            # Call without system_prompt
            await manager.run_unity(
                prompt="Test Prompt",
                provider="test-provider",
                options={}
            )

            # Verify get_pref called
            mock_get_pref.assert_called_with("default_code_system_prompt")

            # Verify agent called with fallback prompt
            call_args = manager.unity_agent.run.call_args
            # args: prompt, provider, options, api_keys, system_prompt
            assert call_args[0][4] == "Default System Prompt"

@pytest.mark.asyncio
async def test_run_unity_explicit_system_prompt():
    # Mock UnityAgent
    with patch("app.agent_manager.UnityAgent") as MockUnityAgent:
        # Mock get_pref
        with patch("app.agent_manager.get_pref") as mock_get_pref:
            
            # Setup
            manager = AgentManager()
            manager.unity_agent = MagicMock()
            manager.unity_agent.run = MagicMock()
            async def mock_run(*args, **kwargs):
                return {"content": "result"}
            manager.unity_agent.run.side_effect = mock_run

            # Call with system_prompt
            await manager.run_unity(
                prompt="Test Prompt",
                provider="test-provider",
                options={},
                system_prompt="Explicit System Prompt"
            )

            # Verify get_pref NOT called
            mock_get_pref.assert_not_called()

            # Verify agent called with explicit prompt
            call_args = manager.unity_agent.run.call_args
            # args: prompt, provider, options, api_keys, system_prompt
            assert call_args[0][4] == "Explicit System Prompt"
