"""
Tests for the ``/generate/video`` FastAPI endpoint.

Verifies that the endpoint correctly delegates to ``AgentManager.run_video``,
handles errors gracefully, and returns the expected response shape.
"""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult

client = TestClient(app)


class TestVideoEndpoint:
    """Tests for POST /generate/video."""

    @patch("app.main.agent_manager")
    def test_video_endpoint_success(self, mock_manager: MagicMock) -> None:
        """Successful video generation returns ok response."""
        mock_manager.run_video.return_value = AgentResult(
            video="https://cdn.example.com/video.mp4",
            provider="runway",
            model="gen-3-alpha",
        )

        resp = client.post("/generate/video", json={
            "prompt": "A sunrise over mountains",
            "provider": "runway",
            "api_key": "r-key",
        })

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["video"] == "https://cdn.example.com/video.mp4"
        assert body["data"]["provider"] == "runway"

    @patch("app.main.agent_manager")
    def test_video_endpoint_error(self, mock_manager: MagicMock) -> None:
        """Video generation failure returns error response."""
        mock_manager.run_video.side_effect = RuntimeError("No video adapter")

        resp = client.post("/generate/video", json={
            "prompt": "A sunset",
        })

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is False
        assert "No video adapter" in body["error"]

    @patch("app.main.agent_manager")
    def test_video_endpoint_with_options(self, mock_manager: MagicMock) -> None:
        """Options dict is forwarded to the agent manager."""
        mock_manager.run_video.return_value = AgentResult(
            video="url", provider="pika",
        )

        resp = client.post("/generate/video", json={
            "prompt": "A wave",
            "options": {"duration": 10, "resolution": "1080p"},
        })

        assert resp.status_code == 200
        call_args = mock_manager.run_video.call_args
        assert call_args is not None

    @patch("app.main.agent_manager")
    def test_video_endpoint_with_system_prompt(self, mock_manager: MagicMock) -> None:
        """System prompt is passed through to the manager."""
        mock_manager.run_video.return_value = AgentResult(
            video="url", provider="luma",
        )

        resp = client.post("/generate/video", json={
            "prompt": "A forest",
            "system_prompt": "Create cinematic content",
        })

        assert resp.status_code == 200
        call_args = mock_manager.run_video.call_args
        assert call_args is not None
