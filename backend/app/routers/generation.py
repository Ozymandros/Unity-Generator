import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from ..core.db import get_pref
from ..schemas import (
    AudioOptions,
    CodeOptions,
    GenerationRequest,
    GenerationResponse,
    ImageOptions,
    SpritesRequest,
    TextOptions,
    VideoOptions,
    error_response,
    ok_response,
)
from ..services import agent_manager_instance as agent_manager
from ..services import sprite_service

router = APIRouter(prefix="/generate", tags=["generation"])


@router.post("/text", response_model=GenerationResponse)
def generate_text(request: GenerationRequest) -> GenerationResponse:
    """
    Generate game narrative or text content using the AI text agent.
    """
    try:
        print(f"\n[ROUTER] /generate/text received: provider={request.provider}, options={request.options}")
        provider = request.provider or get_pref("preferred_llm_provider")
        print(f"[ROUTER] Resolved provider for agent_manager: {provider}")

        options: TextOptions | dict[str, Any] = request.options
        if isinstance(options, dict):
            options = TextOptions(**options)

        data = agent_manager.run_text(
            request.prompt,
            provider,
            options,
            request.api_key,
            request.system_prompt,
            request.project_path,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Text generation failed: %s", exc)
        return error_response(str(exc))


@router.post("/code", response_model=GenerationResponse)
def generate_code(request: GenerationRequest) -> GenerationResponse:
    """
    Generate Unity C# code using the AI code agent.
    """
    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        options: CodeOptions | dict[str, Any] = request.options
        if isinstance(options, dict):
            options = CodeOptions(**options)

        data = agent_manager.run_code(
            request.prompt,
            provider,
            options,
            request.api_key,
            request.system_prompt,
            request.project_path,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Code generation failed: %s", exc)
        return error_response(str(exc))


@router.post("/image", response_model=GenerationResponse)
def generate_image(request: GenerationRequest) -> GenerationResponse:
    """
    Generate textures or concept art using the AI image agent.
    """
    try:
        provider = request.provider or get_pref("preferred_image_provider")
        options: ImageOptions | dict[str, Any] = request.options
        if isinstance(options, dict):
            options = ImageOptions(**options)

        data = agent_manager.run_image(
            request.prompt,
            provider,
            options,
            request.api_key,
            request.system_prompt,
            request.project_path,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Image generation failed: %s", exc)
        return error_response(str(exc))


@router.post("/audio", response_model=GenerationResponse)
def generate_audio(request: GenerationRequest) -> GenerationResponse:
    """
    Generate SFX or music using the AI audio agent.
    """
    try:
        provider = request.provider or get_pref("preferred_audio_provider")
        options: AudioOptions | dict[str, Any] = request.options
        if isinstance(options, dict):
            options = AudioOptions(**options)

        data = agent_manager.run_audio(
            request.prompt,
            provider,
            options,
            request.api_key,
            request.system_prompt,
            request.project_path,
            request.modality,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Audio generation failed: %s", exc)
        return error_response(str(exc))


@router.post("/video", response_model=GenerationResponse)
def generate_video(request: GenerationRequest) -> GenerationResponse:
    """
    Generate a video clip using the AI video agent.
    """
    try:
        provider = request.provider or get_pref("preferred_video_provider")
        options: VideoOptions | dict[str, Any] = request.options
        if isinstance(options, dict):
            options = VideoOptions(**options)

        data = agent_manager.run_video(
            request.prompt,
            provider,
            options,
            request.api_key,
            request.system_prompt,
            request.project_path,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Video generation failed: %s", exc)
        return error_response(str(exc))


@router.post("/sprites", response_model=GenerationResponse)
def generate_sprites(request: SpritesRequest) -> GenerationResponse:
    """
    Generate 2D sprite sheets using the AI sprite agent.
    """
    try:
        provider = request.provider or get_pref("preferred_image_provider")
        api_key = request.api_key

        data = sprite_service.generate_sprite(
            request.prompt,
            provider,
            api_key,
            request.resolution,
            request.options,
            system_prompt=request.system_prompt,
            project_path=request.project_path,
        )
        result_data = data.dict() if hasattr(data, 'dict') else data
        return GenerationResponse(
            success=True,
            date=datetime.now(timezone.utc).isoformat(),
            error=None,
            data=result_data if isinstance(result_data, dict) else dict(result_data),
        )
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Sprite generation failed: %s", exc
        )
        return GenerationResponse(
            success=False,
            date=datetime.now(timezone.utc).isoformat(),
            error=str(exc),
            data=None,
        )
