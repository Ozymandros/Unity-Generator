"""Prompt assist endpoint (enhance / sample) without MCP tools."""

import logging

from fastapi import APIRouter

from ..core.db import get_pref
from ..schemas import GenerationResponse, PromptAssistRequest, error_response, ok_response
from ..services import agent_manager_instance as agent_manager

router = APIRouter(prefix="/api/prompt-assist", tags=["prompt-assist"])


@router.post("", response_model=GenerationResponse)
def prompt_assist(request: PromptAssistRequest) -> GenerationResponse:
    """
    Enhance or sample a Unity prompt using a lightweight text agent (no tools).

    Args:
        request: Prompt assist request with mode ``enhance`` or ``sample``.

    Returns:
        GenerationResponse with improved or sample prompt in ``data.content``.
    """
    if not request.prompt or not request.prompt.strip():
        return error_response("Prompt cannot be empty")

    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        if not provider:
            return error_response(
                "No provider specified and no preferred provider found in settings."
            )
        data = agent_manager.run_prompt_assist(
            prompt=request.prompt,
            mode=request.mode,
            provider=provider,
            options=request.options,
            api_key=request.api_key,
        )
        return ok_response(data)
    except ValueError as exc:
        logging.getLogger("failed_requests").warning("Prompt assist failed (ValueError): %s", exc)
        return error_response(str(exc))
    except Exception as exc:
        logging.getLogger("failed_requests").warning("Prompt assist failed: %s", exc)
        return error_response(str(exc))
