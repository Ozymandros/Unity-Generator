"""Backend log tail endpoint for the Logs panel."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Query

from ..core.config import get_logs_dir
from ..schemas import GenerationResponse, error_response, ok_response

router = APIRouter(prefix="/api/logs", tags=["logs"])
LOGGER = logging.getLogger(__name__)


@router.get("/tail", response_model=GenerationResponse)
def tail_logs(lines: int = Query(default=200, ge=1, le=2000)) -> GenerationResponse:
    """
    Return the last N lines from the backend log file.

    Args:
        lines: Number of lines to return (1–2000).

    Returns:
        GenerationResponse with ``data.lines`` list and ``data.path``.
    """
    log_path = Path(get_logs_dir()) / "backend.log"
    if not log_path.exists():
        return ok_response({"lines": [], "path": str(log_path), "message": "Log file not found."})

    try:
        content = log_path.read_text(encoding="utf-8", errors="replace")
        tail = content.splitlines()[-lines:]
        return ok_response({"lines": tail, "path": str(log_path)})
    except OSError as exc:
        LOGGER.warning("Failed to read log tail: %s", exc)
        return error_response(f"Could not read log file: {exc}")
