from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult

client = TestClient(app)

def test_create_scene_success():
    with patch("app.routers.scenes.agent_manager") as mock_agent_manager, \
         patch("app.routers.scenes.get_pref") as mock_get_pref:

        # Mock preferences to return a provider
        mock_get_pref.side_effect = lambda key: "openai" if key == "preferred_llm_provider" else None

        # Mock the run_unity method
        mock_agent_manager.run_unity = MagicMock()
        async def mock_run(*args, **kwargs):
            return {
                "content": "Scene created successfully.",
                "files": ["Scene.unity"],
                "metadata": {"steps": ["Step 1", "Step 2"]}
            }
        mock_agent_manager.run_unity.side_effect = mock_run

        response = client.post(
            "/api/scenes/create",
            json={
                "prompt": "Create a red cube",
                "system_prompt": "Fast mode",
                "options": {"model": "gpt-4"} # Must provide model now
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify agent was called with correct args
        mock_agent_manager.run_unity.assert_called_once()
        call_args = mock_agent_manager.run_unity.call_args
        assert call_args.kwargs["prompt"] == "Create a red cube"
        assert call_args.kwargs["provider"] == "openai" # From mocked pref
        assert call_args.kwargs["options"]["model"] == "gpt-4"

def test_create_scene_missing_config():
    with patch("app.routers.scenes.get_pref") as mock_get_pref:
        # Simulate no stored preference
        mock_get_pref.return_value = None

        response = client.post(
            "/api/scenes/create",
            json={"prompt": "Do something"}
        )

        # Should fail because no provider in request OR prefs
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "No provider specified" in data["error"]

def test_create_scene_with_api_key():
    with patch("app.routers.scenes.agent_manager") as mock_agent_manager, \
         patch("app.routers.scenes.get_pref") as mock_get_pref:

        mock_get_pref.return_value = "openai"
        mock_agent_manager.run_unity = MagicMock()
        async def mock_run(*args, **kwargs):
            return {"content": "Success"}
        mock_agent_manager.run_unity.side_effect = mock_run

        response = client.post(
            "/api/scenes/create",
            json={
                "prompt": "Create a blue sphere",
                "api_key": "sk-12345",
                "options": {"model": "gpt-4"}
            }
        )

        assert response.status_code == 200
        mock_agent_manager.run_unity.assert_called_once()
        call_args = mock_agent_manager.run_unity.call_args
        assert call_args.kwargs["api_key"] == "sk-12345"

def test_create_scene_with_provider_and_options():
    with patch("app.routers.scenes.agent_manager") as mock_agent_manager:
        mock_agent_manager.run_unity = MagicMock()
        async def mock_run(*args, **kwargs):
            return {"content": "Success"}
        mock_agent_manager.run_unity.side_effect = mock_run

        response = client.post(
            "/api/scenes/create",
            json={
                "prompt": "Test Prompt",
                "provider": "openai",
                "options": {"model": "gpt-4-turbo", "temperature": 0.5}
            }
        )

        assert response.status_code == 200
        mock_agent_manager.run_unity.assert_called_once()
        call_args = mock_agent_manager.run_unity.call_args
        assert call_args.kwargs["provider"] == "openai"
        assert call_args.kwargs["options"]["model"] == "gpt-4-turbo"

def test_create_scene_failure():
    with patch("app.routers.scenes.agent_manager") as mock_agent_manager, \
         patch("app.routers.scenes.get_pref") as mock_get_pref:

        mock_get_pref.return_value = "openai"
        mock_agent_manager.run_unity.side_effect = Exception("Unity error")

        response = client.post(
            "/api/scenes/create",
            json={"prompt": "Fail me", "options": {"model": "gpt-4"}}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Unity error" in data["error"]


def test_create_scene_agent_returns_error_in_raw():
    """When run_unity returns a result with error in raw, API returns success=False."""
    with patch("app.routers.scenes.agent_manager") as mock_agent_manager, \
         patch("app.routers.scenes.get_pref") as mock_get_pref:

        mock_get_pref.return_value = "openai"
        mock_agent_manager.run_unity = MagicMock()
        async def mock_run(*args, **kwargs):
            return AgentResult(
                content="Failed to execute Unity task: 1 validation error for KernelParameterMetadata...",
                provider="openai",
                raw={"content": "Failed to execute Unity task: ...", "error": "1 validation error for KernelParameterMetadata"},
            )
        mock_agent_manager.run_unity.side_effect = mock_run

        response = client.post(
            "/api/scenes/create",
            json={"prompt": "Create a cube", "options": {"model": "gpt-4"}},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert "KernelParameterMetadata" in data["error"]
