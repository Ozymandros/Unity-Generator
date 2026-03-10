from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_get_latest_output(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core import config

    def fake_root() -> Path:
        return tmp_path

    monkeypatch.setattr(config, "get_repo_root", fake_root)
    output_dir = tmp_path / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "ProjectA").mkdir()

    client = TestClient(app)
    client = TestClient(app)
    response = client.get("/output/latest")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
