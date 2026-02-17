from fastapi import APIRouter
from ..core.db import get_pref, set_pref
from ..schemas import (
    GenerationResponse,
    PrefRequest,
    ok_response,
)

router = APIRouter(prefix="/prefs", tags=["preferences"])

@router.get("/{key}", response_model=GenerationResponse)
def get_pref_endpoint(key: str) -> GenerationResponse:
    """
    Get a user preference by key.
    """
    value = get_pref(key)
    return ok_response({"key": key, "value": value})


@router.post("", response_model=GenerationResponse)
def set_pref_endpoint(request: PrefRequest) -> GenerationResponse:
    """
    Set a user preference.
    """
    set_pref(request.key, request.value)
    return ok_response({"key": request.key})

