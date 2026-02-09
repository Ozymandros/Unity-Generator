from fastapi.testclient import TestClient

from app.main import app


def test_config_keys_roundtrip(tmp_path, monkeypatch) -> None:
    from app import config

    def fake_root():
        return tmp_path

    monkeypatch.setattr(config, "get_repo_root", fake_root)

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
