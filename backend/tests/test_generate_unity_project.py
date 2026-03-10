from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app as fastapi_app


def test_generate_unity_project_schema(monkeypatch):
    # Patch AgentManager methods to return dummy data
    from app.schemas import AgentResult
    from app.services import agent_manager_instance as agent_manager

    monkeypatch.setattr(
        agent_manager,
        "run_code",
        lambda *args, **kwargs: AgentResult(content="dummy code", provider="openai"),
    )
    monkeypatch.setattr(
        agent_manager,
        "run_text",
        lambda *args, **kwargs: AgentResult(content="dummy text", provider="openai"),
    )
    import base64

    valid_image = base64.b64encode(b"dummydata").decode("utf-8")
    monkeypatch.setattr(
        agent_manager,
        "run_image",
        lambda *args, **kwargs: AgentResult(
            image=valid_image, provider="stable-diffusion"
        ),
    )
    monkeypatch.setattr(
        agent_manager,
        "run_audio",
        lambda *args, **kwargs: AgentResult(
            audio="http://example.com/audio.mp3", provider="elevenlabs"
        ),
    )
    # Mock _download to avoid real HTTP requests for audio
    import app.services.unity_project as unity_project_mod
    monkeypatch.setattr(unity_project_mod, "_download", lambda url: b"dummy audio bytes")

    # Patch API key repository
    from app.repositories import get_api_key_repo
    repo = get_api_key_repo()
    dummy_keys = {"openai": "sk-test", "stability": "st-test"}

    with patch.object(repo, "get_all", return_value=dummy_keys):
        client = TestClient(fastapi_app)
        payload = {
            "project_name": "TestProject",
            "code_prompt": "Player movement script",
            "text_prompt": "Game intro text",
            "image_prompt": "Player sprite",
            "audio_prompt": "Jump sound",
            "provider_overrides": {
                "code": "openai",
                "text": "openai",
                "image": "stable-diffusion",
                "audio": "elevenlabs",
            },
            "options": {
                "code": {"temperature": 0.7, "max_tokens": 128},
                "text": {"temperature": 0.7, "max_tokens": 128},
                "image": {"aspect_ratio": "1:1", "quality": "standard"},
                "audio": {"voice": "default", "stability": 0.5},
            },
            "unity_template": "3d",
            "unity_version": "2022.3",
            "unity_platform": "windows",
        }
        response = client.post("/generate/unity-project", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
    assert "project_path" in data["data"]
    assert data["data"]["project_path"]


@pytest.mark.parametrize(
    "template,version,platform",
    [
        ("2d", "2021.3", "mac"),
        ("urp", "2022.3", "linux"),
        ("hdrp", "2023.1", "android"),
        ("mobile", "2022.3", "ios"),
        ("vr", "2023.1", "windows"),
    ],
)
def test_generate_unity_project_variants(template, version, platform):
    client = TestClient(fastapi_app)
    payload = {
        "project_name": f"Test_{template}_{platform}",
        "unity_template": template,
        "unity_version": version,
        "unity_platform": platform,
    }
    response = client.post("/generate/unity-project", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"]
    assert "project_path" in data["data"]
    assert data["data"]["project_path"]
