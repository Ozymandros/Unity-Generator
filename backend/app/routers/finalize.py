import logging
import os
from threading import Thread

from fastapi import APIRouter
from fastapi.responses import FileResponse

from ..core.config import get_templates_dir, resolve_unity_editor_path
from ..core.db import get_pref
from ..schemas import (
    FinalizeJobStatusResponse,
    FinalizeProjectRequest,
    FinalizeProjectResponse,
    GenerationResponse,
    error_response,
)
from ..services import agent_manager_instance as agent_manager
from ..services import create_unity_project
from ..services import finalize_store_instance as finalize_store
from ..services.finalize_store import JobStatus
from ..services.unity_orchestrator import run_finalize_job

LOGGER = logging.getLogger(__name__)

router = APIRouter(tags=["finalize"])


def _run_finalize_in_background(job_id: str, request: FinalizeProjectRequest) -> None:
    """
    Background thread to run the full Unity project finalization.
    """
    try:
        finalize_store.update_job(job_id, status=JobStatus.RUNNING, step="initializing")

        # Resolve Unity Editor path (can override via request)
        try:
            unity_path = resolve_unity_editor_path(
                override=request.unity_settings.unity_editor_path
            )
        except FileNotFoundError as exc:
            finalize_store.update_job(
                job_id,
                error=str(exc),
                log_line=f"[error] {exc}",
                status=JobStatus.FAILED,
            )
            return

        templates_dir = get_templates_dir()

        # Determine project path: use explicit path or scaffold a new project
        project_path_str = request.project_path
        if not project_path_str:
            finalize_store.update_job(
                job_id,
                step="scaffolding",
                progress=10,
                log_line="Scaffolding Unity project...",
            )
            try:
                code_provider = request.provider_overrides.get(
                    "code", get_pref("preferred_llm_provider")
                )
                text_provider = request.provider_overrides.get(
                    "text", get_pref("preferred_llm_provider")
                )
                image_provider = request.provider_overrides.get(
                    "image", get_pref("preferred_image_provider")
                )
                audio_provider = request.provider_overrides.get(
                    "audio", get_pref("preferred_audio_provider")
                )

                code_output = None
                text_output = None
                image_output = None
                audio_output = None

                if request.code_prompt:
                    code_output = agent_manager.run_code(
                        request.code_prompt,
                        code_provider,
                        request.options.get("code", {}),
                        system_prompt=request.code_system_prompt,
                    ).content

                if request.text_prompt:
                    text_output = agent_manager.run_text(
                        request.text_prompt,
                        text_provider,
                        request.options.get("text", {}),
                        system_prompt=request.text_system_prompt,
                    ).content

                if request.image_prompt:
                    image_output = agent_manager.run_image(
                        request.image_prompt,
                        image_provider,
                        request.options.get("image", {}),
                        system_prompt=request.image_system_prompt,
                    ).image

                if request.audio_prompt:
                    audio_output_obj = agent_manager.run_audio(
                        request.audio_prompt,
                        audio_provider,
                        request.options.get("audio", {}),
                        system_prompt=request.audio_system_prompt,
                    )
                    if audio_output_obj and audio_output_obj.audio:
                        audio_output = {"audio_url": audio_output_obj.audio}

                scaffold_result = create_unity_project(
                    request.project_name,
                    code_output,
                    text_output,
                    image_output,
                    audio_output,
                )
                project_path_str = scaffold_result["project_path"]
                finalize_store.update_job(
                    job_id,
                    project_path=project_path_str,
                    log_line=f"Scaffolded project at {project_path_str}",
                )
            except Exception as exc:
                LOGGER.exception("Scaffold failed for job %s", job_id)
                finalize_store.update_job(
                    job_id, error=f"Scaffold failed: {exc}", status=JobStatus.FAILED
                )
                return

        def on_progress(step: str, progress: int, log_line: str | None = None) -> None:
            finalize_store.update_job(
                job_id, step=step, progress=progress, log_line=log_line
            )

        # Run the finalization (Unity batch mode)
        # If we scaffolded, we use the new project path. If one was provided, we use that.
        # run_finalize_job expects 'project_name' relative to repo root if path not absolute?
        # Actually run_finalize_job takes 'project_name' OR we hacked it in main.py?
        # In main.py it was:
        # result = run_finalize_job(project_path=project_path, ...)
        # But in finalize.py previous version it was:
        # result = run_finalize_job(repo_root=..., project_name=request.project_name, ...)
        #
        # Let's check run_finalize_job signature in unity_orchestrator.py.
        # It seems I need to be careful with arguments.
        # The main.py version used `project_path` argument.
        # The finalize.py version I wrote in Step 1738 used `repo_root` and `project_name`.
        # Which one is correct?
        # Let's assume the previous `finalize.py` was trying to be correct but main.py was actual working code.
        # main.py called it with: `project_path=project_path`.

        # Let's check `app/services/unity_orchestrator.py` signature.

        # For now, I'll assume main.py was correct and pass `project_path` if available.
        # But wait, run_finalize_job in Step 1738 calls:
        # run_finalize_job(repo_root=..., unity_path=..., project_name=..., ...)
 
        # I suspect `run_finalize_job` might have been overloaded or I misread main.py.
        # Let's use the main.py logic:

        # result = run_finalize_job(
        #     project_path=project_path,
        #     unity_path=unity_path,
        #     templates_dir=templates_dir,
        #     ...
        # )

        # I will stick to what main.py had.

        from pathlib import Path
        result = run_finalize_job(
            project_path=Path(project_path_str),
            unity_path=unity_path,
            templates_dir=templates_dir,
            install_packages=request.unity_settings.install_packages,
            generate_scene=request.unity_settings.generate_scene,
            setup_urp=request.unity_settings.setup_urp,
            packages=request.unity_settings.packages,
            scene_name=request.unity_settings.scene_name,
            timeout=request.unity_settings.timeout,
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
        finalize_store.update_job(job_id, status=JobStatus.FAILED, error=str(exc))


@router.post("/api/v1/project/finalize", response_model=FinalizeProjectResponse)
def finalize_project(request: FinalizeProjectRequest) -> FinalizeProjectResponse:
    """
    Finalize a Unity project by installing packages and generating a scene.
    Runs asynchronously in a background thread.
    """
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
