"""Tests for the finalize workflow API endpoints."""


import time
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.finalize_store import JobStatus, finalize_store
from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _wait_for_job(job_id: str, timeout: float = 5.0) -> Any:
    """Poll the finalize status endpoint until the job reaches a terminal state."""
    deadline = time.time() + timeout
    data: dict[str, Any] = {}
    while time.time() < deadline:
        resp = client.get(f"/api/v1/project/finalize/{job_id}")
        data = resp.json()
        if data["status"] in ("completed", "failed", "not_found"):
            return data
        time.sleep(0.2)
    return data


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestFinalizeEndpoint:
    @patch("threading.Thread")
    def test_finalize_workflow(self, mock_thread: MagicMock) -> None:
        """POST /api/v1/project/finalize should return a job_id immediately."""
        resp = client.post(
            "/api/v1/project/finalize",
            json={
                "project_name": "TestProject",
                "unity_settings": {
                    "generate_scene": True,
                    "scene_name": "TestScene",
                },
            },
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "job_id" in data
        assert len(data["job_id"]) > 0

    def test_poll_nonexistent_job(self) -> None:
        """Polling a non-existent job should return not_found status."""
        resp = client.get("/api/v1/project/finalize/nonexistent123")
        data = resp.json()
        assert data["status"] == "not_found"
        assert data["errors"] == ["Job not found"]

    def test_finalize_project_success(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test the full lifecycle: create -> running -> completed/failed (terminal)."""
        from app import unity_project

        monkeypatch.setattr(unity_project, "get_repo_root", lambda: tmp_path)

        # Mock agent_manager
        mock_am = MagicMock()
        monkeypatch.setattr("app.main.agent_manager", mock_am)

        # Mock resolve_unity_editor_path to return a path
        unity_exe = tmp_path / "Unity.exe"
        unity_exe.touch()
        monkeypatch.setattr("app.main.resolve_unity_editor_path", lambda override=None: unity_exe)

        # Mock run_finalize_job at the module level where it gets imported
        from services.unity_orchestrator import FinalizeResult

        def fake_finalize(*args: Any, **kwargs: Any) -> FinalizeResult:
            on_progress = kwargs.get("on_progress")
            if on_progress:
                on_progress("test", 50, "Testing...")
                on_progress("done", 100, "Complete")
            zip_path = str(tmp_path / "output.zip")
            (tmp_path / "output.zip").write_bytes(b"PK")
            return FinalizeResult(
                success=True,
                project_path=str(tmp_path / "project"),
                zip_path=zip_path,
                logs=["Done"],
            )

        monkeypatch.setattr("services.unity_orchestrator.run_finalize_job", fake_finalize)

        resp = client.post(
            "/api/v1/project/finalize",
            json={"project_name": "LifecycleTest"},
        )
        assert resp.status_code == 200
        job_id = resp.json()["job_id"]

        # Wait for a terminal state
        status = _wait_for_job(job_id, timeout=10)
        assert status["status"] in ("completed", "failed")

    def test_finalize_job_with_unity_error(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test that Unity failures produce proper error diagnostics."""
        from app import unity_project

        monkeypatch.setattr(unity_project, "get_repo_root", lambda: tmp_path)
        mock_am = MagicMock()
        monkeypatch.setattr("app.main.agent_manager", mock_am)

        # Simulate Unity not found
        monkeypatch.setattr(
            "app.main.resolve_unity_editor_path",
            lambda override=None: (_ for _ in ()).throw(FileNotFoundError("Unity not installed")),
        )

        resp = client.post(
            "/api/v1/project/finalize",
            json={"project_name": "ErrorTest"},
        )
        job_id = resp.json()["job_id"]

        status = _wait_for_job(job_id)
        assert status["status"] == "failed"
        assert any("Unity" in e for e in status.get("errors", []))


class TestFinalizeDownload:
    def test_download_not_found_job(self) -> None:
        resp = client.get("/api/v1/project/finalize/noexist/download")
        data = resp.json()
        assert data.get("success") is False or data.get("error")

    def test_download_incomplete_job(self) -> None:
        job = finalize_store.create_job()
        finalize_store.update_job(job.id, status=JobStatus.RUNNING)

        resp = client.get(f"/api/v1/project/finalize/{job.id}/download")
        data = resp.json()
        assert data.get("success") is False or "not completed" in (data.get("error") or "")

    def test_download_completed_job(self, tmp_path: Path) -> None:
        import zipfile

        # Create a real zip file
        zip_path = tmp_path / "project.zip"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("test.txt", "hello")

        job = finalize_store.create_job()
        finalize_store.update_job(
            job.id,
            status=JobStatus.COMPLETED,
            zip_path=str(zip_path),
        )

        resp = client.get(f"/api/v1/project/finalize/{job.id}/download")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"


class TestFinalizeSchemas:
    def test_finalize_request_defaults(self) -> None:
        """Verify default values in FinalizeProjectRequest."""
        from app.schemas import FinalizeProjectRequest

        req = FinalizeProjectRequest()
        assert req.project_name == "UnityProject"
        assert req.unity_settings.install_packages is False
        assert req.unity_settings.generate_scene is False
        assert req.unity_settings.setup_urp is False
        assert req.unity_settings.timeout == 300

    def test_finalize_request_with_settings(self) -> None:
        from app.schemas import FinalizeProjectRequest, UnityEngineSettings

        req = FinalizeProjectRequest(
            project_name="Custom",
            unity_settings=UnityEngineSettings(
                install_packages=True,
                packages=["com.unity.textmeshpro"],
                generate_scene=True,
                scene_name="MyScene",
            ),
        )
        assert req.unity_settings.install_packages is True
        assert req.unity_settings.packages == ["com.unity.textmeshpro"]
        assert req.unity_settings.scene_name == "MyScene"
