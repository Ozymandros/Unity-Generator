import logging

from fastapi import APIRouter

from ..schemas import (
    CreateSceneRequest,
    GenerationResponse,
    error_response,
    ok_response,
)

router = APIRouter(tags=["scenes"])

@router.post("/api/scenes/create", response_model=GenerationResponse)
async def create_scene(request: CreateSceneRequest) -> GenerationResponse:
    """
    Create a Unity scene based on the description using the UnityAgent.
    """
    from ..main import agent_manager, get_pref

    try:
        provider = request.provider or get_pref("preferred_llm_provider")

        if not provider:
             return error_response("No provider specified and no preferred provider found in settings.")

        options = request.options

        data = await agent_manager.run_unity(
            prompt=request.prompt,
            provider=provider,
            options=options,
            api_key=request.api_key,
            system_prompt=request.system_prompt,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Scene creation failed: %s", exc)
        return error_response(str(exc))
