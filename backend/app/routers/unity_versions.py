"""
Unity versions API: list and add versions (id + label) for dropdown.
Initially only 6000.3.2f1 is seeded; users can add more.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..core.db import add_unity_version, get_unity_versions
from ..schemas import GenerationResponse, error_response, ok_response

router = APIRouter(prefix="/unity-versions", tags=["unity-versions"])


class UnityVersionCreate(BaseModel):
    """Body for adding a Unity version (value = id, label = display text)."""
    value: str = Field(..., description="Version id (e.g. 6000.3.2f1)")
    label: str | None = Field(None, description="Display label; defaults to value")


@router.get("", response_model=GenerationResponse)
def list_unity_versions() -> GenerationResponse:
    """
    Return all Unity versions for dropdown (value = id, label = display text).
    """
    try:
        versions = get_unity_versions()
        return ok_response({"versions": versions})
    except Exception as exc:
        return error_response(str(exc))


@router.post("", response_model=GenerationResponse)
def create_unity_version(body: UnityVersionCreate) -> GenerationResponse:
    """
    Add a Unity version. Body: { "value": "6000.3.2f1", "label": "6000.3.2f1" }.
    """
    try:
        value = (body.value or "").strip()
        if not value:
            raise HTTPException(status_code=400, detail="value is required")
        label = (body.label or value).strip()
        add_unity_version(value, label)
        return ok_response({"versions": get_unity_versions()})
    except HTTPException:
        raise
    except ValueError as exc:
        return error_response(str(exc))
    except Exception as exc:
        return error_response(str(exc))
