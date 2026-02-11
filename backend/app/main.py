import logging
import sys
import os
import threading
from pathlib import Path
from typing import Any, Dict

# Add project root to sys.path to allow importing services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .agent_manager import AgentManager
from .config import (
    get_logs_dir,
    get_templates_dir,
    save_api_keys,
    load_api_keys,
    resolve_unity_editor_path,
)
from .db import init_db, get_pref, set_pref
from .finalize_store import JobStatus, finalize_store
from .logging_config import setup_logging
from .schemas import (
    GenerationRequest,
    ApiKeysRequest,
    PrefRequest,
    UnityProjectRequest,
    SpritesRequest,
    FinalizeProjectRequest,
    FinalizeProjectResponse,
    FinalizeJobStatusResponse,
    ok_response,
    error_response,
)
from .unity_project import create_unity_project, get_latest_project_path


setup_logging(get_logs_dir())
LOGGER = logging.getLogger(__name__)

app = FastAPI(title="Unity Generator Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_manager = AgentManager()
init_db()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.post("/generate/code")
def generate_code(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        data = agent_manager.run_code(
            request.prompt, provider, request.options, request.api_key
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Code generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/text")
def generate_text(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        data = agent_manager.run_text(
            request.prompt, provider, request.options, request.api_key
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Text generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/image")
def generate_image(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_image_provider")
        data = agent_manager.run_image(
            request.prompt, provider, request.options, request.api_key
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Image generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/audio")
def generate_audio(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_audio_provider")
        data = agent_manager.run_audio(
            request.prompt, provider, request.options, request.api_key
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Audio generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/sprites")
def generate_sprites(request: SpritesRequest):
    try:
        from services.sprite_service import generate_sprite
        provider = request.provider or get_pref("preferred_image_provider")
        data = generate_sprite(
            request.prompt, 
            provider, 
            request.api_key, 
            request.resolution,
            request.options
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Sprite generation failed: %s", exc
        )
        return error_response(str(exc))


@app.get("/config/keys")
def get_keys():
    keys = load_api_keys()
    masked = {key: ("***" if value else "") for key, value in keys.items()}
    return ok_response({"keys": masked})


@app.post("/config/keys")
def save_keys(request: ApiKeysRequest):
    save_api_keys(request.keys)
    return ok_response({"saved": list(request.keys.keys())})


@app.get("/prefs/{key}")
def read_pref(key: str):
    value = get_pref(key)
    return ok_response({"key": key, "value": value})


@app.post("/prefs")
def write_pref(request: PrefRequest):
    set_pref(request.key, request.value)
    return ok_response({"key": request.key})


@app.post("/generate/unity-project")
def generate_unity_project(request: UnityProjectRequest):
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
            ).get("content")

        if request.text_prompt:
            text_output = agent_manager.run_text(
                request.text_prompt,
                text_provider,
                request.options.get("text", {}),
            ).get("content")

        if request.image_prompt:
            image_output = agent_manager.run_image(
                request.image_prompt,
                image_provider,
                request.options.get("image", {}),
            ).get("image")

        if request.audio_prompt:
            audio_output = agent_manager.run_audio(
                request.audio_prompt,
                audio_provider,
                request.options.get("audio", {}),
            )

        data = create_unity_project(
            request.project_name,
            code_output,
            text_output,
            image_output,
            audio_output,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Unity project generation failed: %s", exc
        )
        return error_response(str(exc))


@app.get("/output/latest")
def output_latest():
    path = get_latest_project_path()
    if not path:
        return error_response("No output projects found.")
    return ok_response({"path": path})


# ---------------------------------------------------------------------------
# Finalize workflow endpoints
# ---------------------------------------------------------------------------


def _run_finalize_in_background(job_id: str, request: FinalizeProjectRequest) -> None:
    """
    Background worker that runs the finalize workflow for a given job.

    This function executes in a separate thread so the HTTP response
    returns immediately with the job_id.
    """
    from services.unity_orchestrator import run_finalize_job

    store = finalize_store
    job = store.get_job(job_id)
    if not job:
        return

    store.update_job(job_id, status=JobStatus.RUNNING, step="initializing", progress=5)

    # Resolve Unity Editor path
    try:
        unity_path = resolve_unity_editor_path(
            override=request.unity_settings.unity_editor_path
        )
    except FileNotFoundError as exc:
        store.update_job(
            job_id,
            error=str(exc),
            log_line=f"[error] {exc}",
        )
        return

    # Determine project path: use explicit path or scaffold a new project
    project_path_str = request.project_path
    if not project_path_str:
        store.update_job(job_id, step="scaffolding", progress=10, log_line="Scaffolding Unity project...")
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
                ).get("content")

            if request.text_prompt:
                text_output = agent_manager.run_text(
                    request.text_prompt,
                    text_provider,
                    request.options.get("text", {}),
                ).get("content")

            if request.image_prompt:
                image_output = agent_manager.run_image(
                    request.image_prompt,
                    image_provider,
                    request.options.get("image", {}),
                ).get("image")

            if request.audio_prompt:
                audio_output = agent_manager.run_audio(
                    request.audio_prompt,
                    audio_provider,
                    request.options.get("audio", {}),
                )

            scaffold_result = create_unity_project(
                request.project_name,
                code_output,
                text_output,
                image_output,
                audio_output,
            )
            project_path_str = scaffold_result["project_path"]
            store.update_job(
                job_id,
                project_path=project_path_str,
                log_line=f"Scaffolded project at {project_path_str}",
            )
        except Exception as exc:
            LOGGER.exception("Scaffold failed for job %s", job_id)
            store.update_job(job_id, error=f"Scaffold failed: {exc}")
            return
    else:
        store.update_job(job_id, project_path=project_path_str)

    project_path = Path(project_path_str)

    # Progress callback
    def on_progress(step: str, progress: int, msg: str) -> None:
        store.update_job(job_id, step=step, progress=progress, log_line=msg)

    templates_dir = get_templates_dir()

    result = run_finalize_job(
        project_path=project_path,
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
        store.update_job(
            job_id,
            status=JobStatus.COMPLETED,
            step="done",
            progress=100,
            project_path=result.project_path,
            zip_path=result.zip_path,
            log_line="Finalization completed successfully.",
        )
    else:
        error_msg = "; ".join(result.errors) if result.errors else "Unknown error"
        store.update_job(
            job_id,
            error=error_msg,
            log_line=f"Finalization failed: {error_msg}",
        )


@app.post("/api/v1/project/finalize", response_model=FinalizeProjectResponse)
def finalize_project(request: FinalizeProjectRequest):
    """
    Create an async finalize job.

    Returns a job_id immediately. Poll ``GET /api/v1/project/finalize/{job_id}``
    for progress and results.
    """
    job = finalize_store.create_job()
    LOGGER.info("Created finalize job %s", job.id)

    thread = threading.Thread(
        target=_run_finalize_in_background,
        args=(job.id, request),
        daemon=True,
    )
    thread.start()

    return FinalizeProjectResponse(
        success=True,
        job_id=job.id,
        message="Finalize job created. Poll status endpoint for progress.",
    )


@app.get("/api/v1/project/finalize/{job_id}", response_model=FinalizeJobStatusResponse)
def finalize_job_status(job_id: str):
    """
    Poll the status and logs of a finalize job.
    """
    job = finalize_store.get_job(job_id)
    if not job:
        return FinalizeJobStatusResponse(
            job_id=job_id,
            status="not_found",
            step="unknown",
            progress=0,
            errors=["Job not found"],
        )

    # Return last 50 log lines to keep response size reasonable
    logs_tail = job.logs[-50:] if job.logs else []

    return FinalizeJobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        step=job.step,
        progress=job.progress,
        logs_tail=logs_tail,
        errors=[job.error] if job.error else [],
        started_at=job.started_at,
        finished_at=job.finished_at,
        project_path=job.project_path,
        zip_path=job.zip_path,
    )


@app.get("/api/v1/project/finalize/{job_id}/download")
def finalize_job_download(job_id: str):
    """
    Download the zipped project artifact for a completed finalize job.
    """
    job = finalize_store.get_job(job_id)
    if not job:
        return error_response("Job not found")

    if job.status != JobStatus.COMPLETED:
        return error_response(f"Job is not completed (status: {job.status.value})")

    if not job.zip_path:
        return error_response("No zip artifact available for this job")

    zip_file = Path(job.zip_path)
    if not zip_file.exists():
        return error_response("Zip file not found on disk")

    return FileResponse(
        path=str(zip_file),
        filename=zip_file.name,
        media_type="application/zip",
    )
