"""Unity MCP status endpoint for capability-aware frontend actions."""

from __future__ import annotations

from fastapi import APIRouter

from ..agents.unity_mcp_plugin import get_unity_mcp_status
from ..schemas import GenerationResponse, error_response, ok_response

router = APIRouter(tags=["unity-mcp"])


@router.get("/api/unity-mcp/status", response_model=GenerationResponse)
def unity_mcp_status() -> GenerationResponse:
    """
    Return Unity MCP availability and Editor-gated capability warnings.

    Returns:
        Generation-style response wrapping a compact capability payload.

    Example:
        GET /api/unity-mcp/status
        {"success": true, "data": {"available": true, "editor_available": false, ...}}
    """
    try:
        payload = get_unity_mcp_status()
        return ok_response(payload)
    except Exception as exc:
        return error_response(str(exc))
