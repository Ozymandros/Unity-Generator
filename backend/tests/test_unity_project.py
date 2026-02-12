import pytest
from pathlib import Path
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult


def test_unity_project_generation(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import unity_project

    def fake_root() -> Path:
        return tmp_path

    monkeypatch.setattr(unity_project, "get_repo_root", fake_root)
    
    # Mock agent_manager to return generated code
    mock_agent_manager = MagicMock()
    mock_agent_manager.run_code.return_value = AgentResult(content="public class PlayerController {}", provider="openai")
    monkeypatch.setattr("app.main.agent_manager", mock_agent_manager)

    client = TestClient(app)
    response = client.post(
        "/generate/unity-project",
        json={
            "project_name": "TestProject",
            "code_prompt": "Create a player controller",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    data = payload["data"]
    assert data["project_path"]
    assert any(str(file).endswith("GeneratedScript.cs") for file in data["files"])

