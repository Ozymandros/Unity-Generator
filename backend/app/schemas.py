from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Agent Result and Options Models
# ---------------------------------------------------------------------------


class AgentResult(BaseModel):
    """Result from an AI agent generation."""

    content: str | None = None
    image: str | None = None
    audio: str | None = None
    provider: str
    model: str | None = None
    raw: dict[str, Any] | None = None


class CodeOptions(BaseModel):
    """Options for code generation."""

    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 2048


class TextOptions(BaseModel):
    """Options for text generation."""

    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 2048


class ImageOptions(BaseModel):
    """Options for image generation."""

    quality: str = "standard"  # standard or hd
    aspect_ratio: str = "1:1"
    output_format: str = "png"
    model: str | None = None
    version: str | None = None


class AudioOptions(BaseModel):
    """Options for audio generation."""

    voice: str = "Rachel"
    model_id: str = "eleven_multilingual_v2"
    stability: float = 0.5
    similarity_boost: float = 0.75
    format: str = "mp3"


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------


class GenerationRequest(BaseModel):
    prompt: str
    provider: str | None = None
    api_key: str | None = None
    options: dict[str, Any] = Field(default_factory=dict)
    system_prompt: str | None = Field(default=None, max_length=4000)
    project_path: str | None = None


class GenerationResponse(BaseModel):
    success: bool
    date: str
    error: str | None
    data: dict[str, Any] | None


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
    code_system_prompt: str | None = None
    text_system_prompt: str | None = None
    image_system_prompt: str | None = None
    audio_system_prompt: str | None = None
    provider_overrides: dict[str, str | None] = Field(default_factory=dict)
    options: dict[str, dict[str, Any]] = Field(default_factory=dict)
    unity_template: str = Field(default="", description="Unity project template (2d, 3d, urp, hdrp, mobile, vr)")
    unity_version: str = Field(default="", description="Unity version (e.g., 2022.3)")
    unity_platform: str = Field(default="", description="Target platform (windows, mac, linux, android, ios)")



class SpritesRequest(BaseModel):
    prompt: str
    provider: str | None = None
    api_key: str | None = None
    resolution: int = 64
    options: dict[str, Any] = Field(default_factory=dict)
    system_prompt: str | None = None
    project_path: str | None = None


class CreateSceneRequest(BaseModel):
    prompt: str
    provider: str | None = None
    options: dict[str, Any] = Field(default_factory=dict)
    api_key: str | None = None
    system_prompt: str | None = None



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
    timeout: int = Field(default=300, ge=30, le=1800)


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
    options: dict[str, dict[str, Any]] = Field(default_factory=dict)

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


# ---------------------------------------------------------------------------
# Helper response builders
# ---------------------------------------------------------------------------


def ok_response(data: "AgentResult | dict[str, Any]") -> GenerationResponse:
    # Convert AgentResult to dict if needed
    if isinstance(data, AgentResult):
        data = data.model_dump(exclude_none=True)
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
