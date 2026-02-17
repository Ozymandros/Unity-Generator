from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_create_scene_success():
    with patch("app.main.agent_manager") as mock_agent_manager:
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
            json={"prompt": "Create a red cube", "system_prompt": "Fast mode"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["content"] == "Scene created successfully."
        assert "Scene.unity" in data["data"]["files"]

        # Verify agent was called with correct args
        mock_agent_manager.run_unity.assert_called_once()
        call_args = mock_agent_manager.run_unity.call_args
        assert call_args.kwargs["prompt"] == "Create a red cube"
        assert call_args.kwargs["system_prompt"] == "Fast mode"
        # Since api_key is None in the request above, it should be None here
        assert call_args.kwargs["api_key"] is None

def test_create_scene_with_api_key():
    with patch("app.main.agent_manager") as mock_agent_manager:
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
            json={"prompt": "Create a blue sphere", "api_key": "sk-12345"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


        # Verify agent was called with correct args
        mock_agent_manager.run_unity.assert_called_once()
        call_args = mock_agent_manager.run_unity.call_args
        assert call_args.kwargs["prompt"] == "Create a blue sphere"
        assert call_args.kwargs["api_key"] == "sk-12345"

def test_create_scene_with_provider_and_options():
    with patch("app.main.agent_manager") as mock_agent_manager:
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
        assert call_args.kwargs["options"]["temperature"] == 0.5

def test_create_scene_failure():
    with patch("app.main.agent_manager") as mock_agent_manager:
        mock_agent_manager.run_unity.side_effect = Exception("Unity error")

        response = client.post(
            "/api/scenes/create",
            json={"prompt": "Fail me"}
        )

        assert response.status_code == 200 # App returns 200 with success=False
        data = response.json()
        assert data["success"] is False
        assert "Unity error" in data["error"]
