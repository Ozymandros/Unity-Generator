import logging
import os
from threading import Thread
from typing import Any

from fastapi import APIRouter
from fastapi.responses import FileResponse
from ..schemas import (
    FinalizeJobStatusResponse,
    FinalizeProjectRequest,
    FinalizeProjectResponse,
    GenerationResponse,
    error_response,
    ok_response,
)

LOGGER = logging.getLogger(__name__)

router = APIRouter(tags=["finalize"])

def _run_finalize_in_background(job_id: str, request: FinalizeProjectRequest) -> None:
    """
    Background thread to run the full Unity project finalization.
    """
    from ..main import agent_manager, finalize_store, resolve_unity_editor_path, get_repo_root
    from ..core.config import get_templates_dir
    from ..services.unity_orchestrator import run_finalize_job
    from ..services.finalize_store import JobStatus

    try:
        finalize_store.update_job(job_id, status=JobStatus.RUNNING, step="initializing")

        unity_path = resolve_unity_editor_path()
        templates_dir = get_templates_dir()

        def on_progress(step: str, progress: int, log_line: str | None = None) -> None:
            finalize_store.update_job(
                job_id, step=step, progress=progress, log_line=log_line
            )

        result = run_finalize_job(
            repo_root=get_repo_root(),
            unity_path=unity_path,
            project_name=request.project_name,
            unity_settings=request.unity_settings,
            templates_dir=templates_dir,
            on_progress=on_progress,
        )

        if result.success:
            finalize_store.update_job(
                job_id,
                status=JobStatus.COMPLETED,
                step="completed",
                progress=100,
                project_path=result.project_path,
                zip_path=result.zip_path,
            )
        else:
            finalize_store.update_job(
                job_id,
                status=JobStatus.FAILED,
                error=result.logs[-1] if result.logs else "Unknown error",
            )

    except Exception as exc:
        LOGGER.exception("Finalize background job %s failed", job_id)
        from ..services.finalize_store import JobStatus
        finalize_store.update_job(job_id, status=JobStatus.FAILED, error=str(exc))


@router.post("/api/v1/project/finalize", response_model=FinalizeProjectResponse)
def finalize_project(request: FinalizeProjectRequest) -> FinalizeProjectResponse:
    """
    Finalize a Unity project by installing packages and generating a scene.
    Runs asynchronously in a background thread.
    """
    from ..main import finalize_store

    try:
        job = finalize_store.create_job()
        thread = Thread(target=_run_finalize_in_background, args=(job.id, request))
        thread.start()

        return FinalizeProjectResponse(
            success=True,
            job_id=job.id,
            message="Finalize job started."
        )
    except Exception as exc:
        LOGGER.error("Failed to start finalize job: %s", exc)
        return FinalizeProjectResponse(
            success=False,
            job_id="",
            message=str(exc)
        )


@router.get("/api/v1/project/finalize/{job_id}", response_model=FinalizeJobStatusResponse)
def get_finalize_status(job_id: str) -> FinalizeJobStatusResponse:
    """
    Get the status and logs for a specific finalize job.
    """
    from ..main import finalize_store

    job = finalize_store.get_job(job_id)
    if not job:
        return FinalizeJobStatusResponse(
            job_id=job_id,
            status="not_found",
            step="error",
            progress=0,
            errors=["Job not found"]
        )

    return FinalizeJobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        progress=job.progress,
        step=job.step,
        logs_tail=job.logs[-10:] if job.logs else [],
        errors=[job.error] if job.error else [],
        project_path=job.project_path,
        zip_path=job.zip_path,
        started_at=job.started_at,
        finished_at=job.finished_at,
    )


@router.get("/api/v1/project/finalize/{job_id}/download", response_model=None)
def finalize_job_download(job_id: str) -> FileResponse | GenerationResponse:
    """
    Download the zipped project artifact for a completed finalize job.
    """
    from ..main import finalize_store
    from ..services.finalize_store import JobStatus

    job = finalize_store.get_job(job_id)
    if not job:
        return error_response("Job not found")

    if job.status != JobStatus.COMPLETED:
        return error_response(f"Job is not completed (status: {job.status.value})")

    if not job.zip_path or not os.path.exists(job.zip_path):
        return error_response("Zip file not found on disk")

    filename = os.path.basename(job.zip_path)
    return FileResponse(
        job.zip_path, media_type="application/zip", filename=filename
    )
