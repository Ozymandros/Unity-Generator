from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class GenerationRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    api_key: Optional[str] = None
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
    unity_template: str = Field(default="", description="Unity project template (2d, 3d, urp, hdrp, mobile, vr)")
    unity_version: str = Field(default="", description="Unity version (e.g., 2022.3)")
    unity_platform: str = Field(default="", description="Target platform (windows, mac, linux, android, ios)")


class SpritesRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None
    api_key: Optional[str] = None
    resolution: int = 64
    options: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Finalize workflow schemas
# ---------------------------------------------------------------------------


class UnityEngineSettings(BaseModel):
    """Toggle options for the Unity Engine finalize step."""

    install_packages: bool = False
    generate_scene: bool = False
    setup_urp: bool = False
    packages: List[str] = Field(default_factory=list)
    scene_name: str = "MainScene"
    unity_editor_path: Optional[str] = None
    timeout: int = Field(default=300, ge=30, le=1800)


class FinalizeProjectRequest(BaseModel):
    """
    Request to finalize an existing scaffolded Unity project.

    The project is identified either by an explicit *project_path* or by
    generating a new scaffold first via the standard generation payload.
    """

    project_name: str = "UnityProject"
    project_path: Optional[str] = None

    # AI generation payload (reuse from UnityProjectRequest)
    code_prompt: Optional[str] = None
    text_prompt: Optional[str] = None
    image_prompt: Optional[str] = None
    audio_prompt: Optional[str] = None
    provider_overrides: Dict[str, Optional[str]] = Field(default_factory=dict)
    options: Dict[str, Dict[str, Any]] = Field(default_factory=dict)

    # Unity Engine settings
    unity_settings: UnityEngineSettings = Field(default_factory=UnityEngineSettings)


class FinalizeProjectResponse(BaseModel):
    """Returned immediately when a finalize job is created."""

    success: bool
    job_id: str
    message: str


class FinalizeJobStatusResponse(BaseModel):
    """Polling response for finalize job progress."""

    job_id: str
    status: str  # pending | running | completed | failed
    step: str
    progress: int
    logs_tail: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    project_path: Optional[str] = None
    zip_path: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper response builders
# ---------------------------------------------------------------------------


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
