from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class GenerationRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    options: Dict[str, Any] = Field(default_factory=dict)


class GenerationResponse(BaseModel):
    success: bool
    date: str
    error: Optional[str]
    data: Optional[Dict[str, Any]]


class ApiKeysRequest(BaseModel):
    keys: Dict[str, str]


class PrefRequest(BaseModel):
    key: str
    value: str


class UnityProjectRequest(BaseModel):
    project_name: str = "UnityProject"
    code_prompt: Optional[str] = None
    text_prompt: Optional[str] = None
    image_prompt: Optional[str] = None
    audio_prompt: Optional[str] = None
    provider_overrides: Dict[str, Optional[str]] = Field(default_factory=dict)
    options: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


def ok_response(data: Dict[str, Any]) -> GenerationResponse:
    return GenerationResponse(
        success=True,
        date=datetime.now(timezone.utc).isoformat(),
        error=None,
        data=data,
    )


def error_response(message: str) -> GenerationResponse:
    return GenerationResponse(
        success=False,
        date=datetime.now(timezone.utc).isoformat(),
        error=message,
        data=None,
    )
