import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
sys.path.append(str(Path(__file__).resolve().parent.parent))

from unittest.mock import MagicMock, patch

import pytest
from agents.code_agent import run as run_code_agent
from backend.app.agent_manager import AgentManager
from backend.app.prompts import DEFAULT_CODE_SYSTEM_PROMPT
from backend.app.schemas import GenerationRequest
from pydantic import ValidationError
from services.llm_provider import _call_openai


def test_system_prompt_override():
    # Test that providing a system prompt overrides the default
    mock_generate = MagicMock()

    with patch("agents.code_agent.generate_text", mock_generate):
        run_code_agent(
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

    with patch("agents.code_agent.generate_text", mock_generate):
        run_code_agent(prompt="Create a script", provider="openai", options={}, api_keys={"openai_api_key": "dummy"})

        # Verify generate_text was called with the default system prompt
        args, kwargs = mock_generate.call_args
        assert kwargs["system_prompt"] == DEFAULT_CODE_SYSTEM_PROMPT


def test_system_prompt_from_db():
    # Test that if no local override is provided, it fetches from DB
    mock_agent = MagicMock()
    mock_agent.run.return_value = {"content": "code", "provider": "openai", "model": "gpt-4"}

    manager = AgentManager()
    manager.code_agent = mock_agent

    with patch("backend.app.agent_manager.get_pref") as mock_get_pref:
        mock_get_pref.return_value = "DB system prompt"

        manager.run_code(prompt="test", provider="openai", options={}, api_key=None)

        mock_get_pref.assert_called_with("default_code_system_prompt")
        # Verify agent run was called with the DB prompt
        args, kwargs = mock_agent.run.call_args
        # signature: run(prompt, provider, options, api_keys, system_prompt)
        # args[4] is system_prompt
        assert args[4] == "DB system prompt"


def test_system_prompt_validation():
    # Test that a system prompt exceeding max length raises ValidationError
    long_prompt = "a" * 4001
    with pytest.raises(ValidationError):
        GenerationRequest(prompt="test", system_prompt=long_prompt)


def test_llm_provider_system_prompt():
    # Test that _call_openai includes the system prompt in messages
    mock_response = MagicMock()
    mock_response.json.return_value = {"choices": [{"message": {"content": "response"}}]}

    with patch("services.llm_provider.requests.post", return_value=mock_response) as mock_post:
        _call_openai(prompt="user prompt", options={}, api_key="dummy", system_prompt="system instruction")

        args, kwargs = mock_post.call_args
        payload = kwargs["json"]
        messages = payload["messages"]

        assert messages[0]["role"] == "system"
        assert messages[0]["content"] == "system instruction"
        assert messages[1]["role"] == "user"
        assert messages[1]["content"] == "user prompt"


if __name__ == "__main__":
    try:
        test_system_prompt_override()
        test_system_prompt_default()
        test_system_prompt_from_db()
        test_system_prompt_validation()
        test_llm_provider_system_prompt()
        print("All tests passed!")
    except Exception as e:
        import traceback

        with open("backend/tests/last_error.txt", "w") as f:
            f.write(traceback.format_exc())
            f.write(f"Test failed: {e}")
        traceback.print_exc()
        print(f"Test failed: {e}")
