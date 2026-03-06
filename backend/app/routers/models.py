"""
Router for managing provider models (CRUD).

Provides endpoints to list, add, and remove AI model entries
for each provider. Models are persisted in the SQLite database.
"""

import logging
import sqlite3

from fastapi import APIRouter, HTTPException

from ..core.db import add_model, get_all_models, get_models, remove_model
from ..schemas import (
    AddModelRequest,
    GenerationResponse,
    ModelEntry,
    ok_response,
    error_response,
)

router = APIRouter(prefix="/api/models", tags=["models"])
logger = logging.getLogger(__name__)


@router.get("", response_model=GenerationResponse)
def list_all_models() -> GenerationResponse:
    """
    Return every model grouped by provider.

    Returns:
        GenerationResponse with ``data.models`` mapping provider → model list.

    Example response::

        {"success": true, "data": {"models": {"openai": [...], "google": [...]}}}
    """
    models = get_all_models()
    return ok_response({"models": models})


@router.get("/{provider}", response_model=GenerationResponse)
def list_provider_models(provider: str) -> GenerationResponse:
    """
    Return all models for a single provider.

    Args:
        provider: Canonical lowercase provider name (path param).

    Returns:
        GenerationResponse with ``data.models`` list.
    """
    models = get_models(provider)
    return ok_response({"models": models})


@router.post("/{provider}", response_model=GenerationResponse)
def create_model(provider: str, request: AddModelRequest) -> GenerationResponse:
    """
    Add a new model entry for a provider.

    Args:
        provider: Canonical lowercase provider name (path param).
        request: Body with ``value`` and ``label``.

    Returns:
        GenerationResponse confirming the addition.

    Raises:
        HTTPException 409: If the model already exists for the provider.
    """
    try:
        add_model(provider, request.value, request.label)
        logger.info("Added model '%s' to provider '%s'", request.value, provider)
        return ok_response({"provider": provider, "model": request.value})
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=f"Model '{request.value}' already exists for provider '{provider}'",
        )
    except ValueError as exc:
        return error_response(str(exc))


@router.delete("/{provider}/{model_value}", response_model=GenerationResponse)
def delete_model(provider: str, model_value: str) -> GenerationResponse:
    """
    Remove a model entry for a provider.

    Args:
        provider: Canonical lowercase provider name (path param).
        model_value: Model identifier to remove (path param).

    Returns:
        GenerationResponse confirming deletion or indicating not found.
    """
    deleted = remove_model(provider, model_value)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_value}' not found for provider '{provider}'",
        )
    logger.info("Removed model '%s' from provider '%s'", model_value, provider)
    return ok_response({"provider": provider, "model": model_value, "deleted": True})
