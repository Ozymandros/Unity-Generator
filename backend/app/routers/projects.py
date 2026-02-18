import logging

from fastapi import APIRouter

from ..core.db import get_pref
from ..schemas import (
    GenerationResponse,
    UnityProjectRequest,
    error_response,
    ok_response,
)
from ..services import agent_manager_instance as agent_manager
from ..services import create_unity_project, get_latest_project_path

router = APIRouter(tags=["projects"])


@router.post("/generate/unity-project", response_model=GenerationResponse)
def generate_project(request: UnityProjectRequest) -> GenerationResponse:
    """
    Generate a full Unity project structure with multiple assets.
    """
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
            audio_result = agent_manager.run_audio(
                request.audio_prompt,
                audio_provider,
                request.options.get("audio", {}),
                system_prompt=request.audio_system_prompt,
            )
            # Pass the result as a dict for legacy create_unity_project
            audio_output = (
                {"audio_url": audio_result.audio} if audio_result.audio else None
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


@router.get("/output/latest", response_model=GenerationResponse)
def get_latest_output() -> GenerationResponse:
    """
    Get the path to the most recently generated project.
    """
    path = get_latest_project_path()
    if not path:
        return error_response("No output projects found.")
    return ok_response({"path": path})
