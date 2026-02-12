"""Tests for /generate/sprites endpoint."""

from unittest.mock import patch

import pytest
from app.main import app
from app.schemas import AgentResult
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_generate_sprites_success(client: TestClient) -> None:
    """Test successful sprite generation endpoint."""
    with patch("services.sprite_service.generate_sprite") as mock_gen:
        mock_gen.return_value = AgentResult(
            image="fake-base64", provider="openai", raw={"resolution": 32}
        )

        response = client.post(
            "/generate/sprites",
            json={
                "prompt": "pixel art hero",
                "resolution": 32,
                "options": {"palette_size": 16},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["image"] == "fake-base64"
        assert data["data"]["raw"]["resolution"] == 32


def test_generate_sprites_error_handling(client: TestClient) -> None:
    """Test error handling in sprites endpoint."""
    with patch("services.sprite_service.generate_sprite") as mock_gen:
        mock_gen.side_effect = ValueError("Processing failed")

        response = client.post("/generate/sprites", json={"prompt": "error prompt"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Processing failed" in data["error"]


def test_generate_sprites_uses_image_provider_preference(client: TestClient) -> None:
    """Test that sprites endpoint uses preferred_image_provider if none specified."""
    with patch("services.sprite_service.generate_sprite") as mock_gen:
        mock_gen.return_value = AgentResult(image="data", provider="stability")
        with patch("app.main.get_pref", return_value="stability"):
            client.post("/generate/sprites", json={"prompt": "test"})

            # Check if it was called with "stability"
            args, _ = mock_gen.call_args
            assert args[1] == "stability"
