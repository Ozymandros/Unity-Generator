import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from app.agents.code_agent import CodeAgent
from app.schemas import GenerationRequest
from app.services.agent_manager import AgentManager
from app.services.prompts import DEFAULT_CODE_SYSTEM_PROMPT

# Mock generate_text at the agent level to prevent real API calls
@pytest.fixture(autouse=True)
def mock_llm_generate():
    with patch("app.agents.code_agent.generate_text") as m1, \
         patch("app.agents.text_agent.generate_text") as m2:
        m1.return_value = {"content": "Mocked LLM Result", "provider": "openai"}
        m2.return_value = {"content": "Mocked LLM Result", "provider": "openai"}
        yield (m1, m2)


def test_system_prompt_override():
    # Test that providing a system prompt overrides the default
    mock_generate = MagicMock()

    # Create proper agent instance
    agent = CodeAgent()
    with patch("app.agents.code_agent.generate_text", mock_generate):
        agent.run(
            prompt="Create a script",
            provider="openai",
            options={},
            api_keys={"openai_api_key": "dummy"},
            system_prompt="Custom system prompt",
        )

        # Verify generate_text was called with the custom system prompt
        args, kwargs = mock_generate.call_args
        assert kwargs["system_prompt"] == "Custom system prompt"


def test_system_prompt_default():
    # Test that not providing a system prompt uses the default
    mock_generate = MagicMock()

    agent = CodeAgent()
    with patch("app.agents.code_agent.generate_text", mock_generate):
        agent.run(
            prompt="Create a script",
            provider="openai",
            options={},
            api_keys={"openai_api_key": "dummy"},
        )

        # Verify generate_text was called with the default system prompt
        args, kwargs = mock_generate.call_args
        assert kwargs["system_prompt"] == DEFAULT_CODE_SYSTEM_PROMPT


def test_system_prompt_from_db():
    # Test that if no local override is provided, it fetches from DB
    manager = AgentManager()
    
    with patch("app.agents.code_agent.CodeAgent.run") as mock_run, \
         patch("app.repositories.get_system_prompt_repo") as mock_get_repo:
        
        mock_repo = MagicMock()
        mock_repo.get.return_value = "DB system prompt"
        mock_get_repo.return_value = mock_repo
        
        mock_run.return_value = {"content": "code", "provider": "openai"}
        
        manager.run_code(prompt="test", provider="openai", options={"model": "gpt-4"}, api_key=None)
        
        # Verify it called the repo
        mock_repo.get.assert_called_with("code")
        # Verify agent run was called with the DB prompt
        args, kwargs = mock_run.call_args
        assert kwargs.get("system_prompt") == "DB system prompt" or args[4] == "DB system prompt"
        # args[4] is system_prompt
        assert args[4] == "DB system prompt"


def test_system_prompt_validation():
    # Test that a system prompt exceeding max length raises ValidationError
    long_prompt = "a" * 4001
    with pytest.raises(ValidationError):
        GenerationRequest(prompt="test", system_prompt=long_prompt)





if __name__ == "__main__":
    try:
        test_system_prompt_override()
        test_system_prompt_default()
        test_system_prompt_from_db()
        test_system_prompt_validation()
        test_system_prompt_validation()
        print("All tests passed!")
    except Exception as e:
        import traceback

        with open("backend/tests/last_error.txt", "w") as f:
            f.write(traceback.format_exc())
            f.write(f"Test failed: {e}")
        traceback.print_exc()
        print(f"Test failed: {e}")
