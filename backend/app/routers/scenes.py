import logging

from fastapi import APIRouter

from ..core.db import get_pref
from ..schemas import (
    CreateSceneRequest,
    GenerationResponse,
    error_response,
    ok_response,
)
from ..services import agent_manager_instance as agent_manager
from ..services.unity_project import resolve_project_path

router = APIRouter(tags=["scenes"])


@router.post("/api/scenes/create", response_model=GenerationResponse)
async def create_scene(request: CreateSceneRequest) -> GenerationResponse:
    """
    Create a Unity scene based on the description using the UnityAgent.
    """
    try:
        provider = request.provider or get_pref("preferred_llm_provider")

        if not provider:
            return error_response(
                "No provider specified and no preferred provider found in settings."
            )

        options = request.options
        # Always: project_path = base_path + project_name
        project_path = resolve_project_path(request.project_name or "UnityProject")

        data = await agent_manager.run_unity(
            prompt=request.prompt,
            provider=provider,
            options=options,
            api_key=request.api_key,
            system_prompt=request.system_prompt,
            project_path=project_path,
        )
        # Agent returns error in raw when Unity task fails; treat as error response
        raw = getattr(data, "raw", None) or {}
        if isinstance(raw, dict) and raw.get("error"):
            return error_response(raw["error"])
        content = getattr(data, "content", "") or ""
        if content and str(content).startswith("Failed to execute Unity task"):
            return error_response(str(content))
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Scene creation failed: %s", exc)
        return error_response(str(exc))
