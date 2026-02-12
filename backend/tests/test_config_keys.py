from pathlib import Path

import pytest
from app.main import app
from fastapi.testclient import TestClient


def test_get_api_keys(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    from app import config

    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    client = TestClient(app)
    response = client.post(
        "/config/keys",
        json={"keys": {"openai_api_key": "test-key"}},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    response = client.get("/config/keys")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "openai_api_key" in payload["data"]["keys"]


def test_post_api_keys(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    from app import config

    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    client = TestClient(app)
    response = client.post("/config/keys", json={"keys": {"test_key": "test_value"}})
    assert response.status_code == 200
    assert response.json()["success"] is True
