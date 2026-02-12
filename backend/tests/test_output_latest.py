from pathlib import Path

import pytest
from app.main import app
from fastapi.testclient import TestClient


def test_get_latest_output(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import unity_project

    def fake_root() -> Path:
        return tmp_path

    monkeypatch.setattr(unity_project, "get_repo_root", fake_root)
    output_dir = tmp_path / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "ProjectA").mkdir()

    client = TestClient(app)
    client = TestClient(app)
    response = client.get("/output/latest")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
