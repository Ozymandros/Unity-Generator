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
