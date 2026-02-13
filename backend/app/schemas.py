from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from .constants import DEFAULT_TIMEOUT


class CodeOptions(BaseModel):
    model: str | None = None
    temperature: float = 0.7
    max_tokens: int = 2000
    language: str = "csharp"


class TextOptions(BaseModel):
    model: str | None = None
    temperature: float = 0.7
    max_tokens: int = 1000


class ImageOptions(BaseModel):
    model: str | None = None
    quality: str = "standard"
    aspect_ratio: str = "1:1"
    output_format: str = "png"
    size: str | None = None


class AudioOptions(BaseModel):
    model: str | None = None
    voice: str = "alloy"
    format: str = "mp3"


class AgentResult(BaseModel):
    content: str | None = None
    image: str | None = None
    audio: str | None = None
    provider: str
    model: str | None = None
    raw: dict[str, Any] | None = None


class GenerationRequest(BaseModel):
    prompt: str
    system_prompt: str | None = Field(
        default=None,
        description="Optional local system prompt override",
        max_length=4000,
    )
    provider: str | None = None
    api_key: str | None = None
    options: (
        CodeOptions | TextOptions | ImageOptions | AudioOptions | dict[str, Any]
    ) = Field(default_factory=dict)


class GenerationResponse(BaseModel):
    success: bool
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error: str | None = None
    data: AgentResult | dict[str, Any] | None = None


def ok_response(data: AgentResult | dict[str, Any]) -> GenerationResponse:
    return GenerationResponse(success=True, data=data)


def error_response(message: str) -> GenerationResponse:
    return GenerationResponse(success=False, error=message)


class ApiKeysRequest(BaseModel):
    keys: dict[str, str]


class PrefRequest(BaseModel):
    key: str
    value: str


class UnityProjectRequest(BaseModel):
    project_name: str = "UnityProject"
    code_prompt: str | None = None
    text_prompt: str | None = None
    image_prompt: str | None = None
    audio_prompt: str | None = None
    code_system_prompt: str | None = Field(default=None, max_length=4000)
    text_system_prompt: str | None = Field(default=None, max_length=4000)
    image_system_prompt: str | None = Field(default=None, max_length=4000)
    audio_system_prompt: str | None = Field(default=None, max_length=4000)
    provider_overrides: dict[str, str | None] = Field(default_factory=dict)
    options: dict[str, Any] = Field(default_factory=dict)
    unity_template: str = Field(
        default="", description="Unity project template (2d, 3d, urp, hdrp, mobile, vr)"
    )
    unity_version: str = Field(default="", description="Unity version (e.g., 2022.3)")
    unity_platform: str = Field(
        default="", description="Target platform (windows, mac, linux, android, ios)"
    )


class SpritesRequest(BaseModel):
    prompt: str
    provider: str | None = None
    api_key: str | None = None
    resolution: int = 64
    system_prompt: str | None = None
    options: ImageOptions = Field(default_factory=ImageOptions)


# ---------------------------------------------------------------------------
# Finalize workflow schemas
# ---------------------------------------------------------------------------


class UnityEngineSettings(BaseModel):
    """Toggle options for the Unity Engine finalize step."""

    install_packages: bool = False
    generate_scene: bool = False
    setup_urp: bool = False
    packages: list[str] = Field(default_factory=list)
    scene_name: str = "MainScene"
    unity_editor_path: str | None = None
    timeout: int = Field(default=DEFAULT_TIMEOUT, ge=30, le=1800)


class FinalizeProjectRequest(BaseModel):
    """
    Request to finalize an existing scaffolded Unity project.

    The project is identified either by an explicit *project_path* or by
    generating a new scaffold first via the standard generation payload.
    """

    project_name: str = "UnityProject"
    project_path: str | None = None

    # AI generation payload (reuse from UnityProjectRequest)
    code_prompt: str | None = None
    text_prompt: str | None = None
    image_prompt: str | None = None
    audio_prompt: str | None = None
    code_system_prompt: str | None = None
    text_system_prompt: str | None = None
    image_system_prompt: str | None = None
    audio_system_prompt: str | None = None
    provider_overrides: dict[str, str | None] = Field(default_factory=dict)
    options: dict[str, Any] = Field(default_factory=dict)

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
    logs_tail: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    started_at: str | None = None
    finished_at: str | None = None
    project_path: str | None = None
    zip_path: str | None = None
