"""
Provider capability definitions.

Each provider declares which modalities and advanced features it supports
so the registry can make informed decisions during selection and routing.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Modality(str, Enum):
    """Supported generation modalities."""

    LLM = "llm"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"


class ProviderCapabilities(BaseModel):
    """
    Describes what a single provider can do.

    Attributes:
        name: Canonical lowercase provider name (e.g. ``"openai"``).
        api_key_name: Key used in the ``api_keys`` dictionary.
        modalities: Set of modalities this provider supports.
        default_models: Mapping ``modality -> default model id``.
        base_url: Optional custom base URL for OpenAI-compatible providers.
        supports_function_calling: Provider supports tool/function calling.
        supports_vision: Provider supports multimodal vision input.
        supports_json_mode: Provider supports structured JSON output.
        supports_streaming: Provider supports streaming responses.
        supports_tool_use: Provider supports generic tool use.
        openai_compatible: Provider follows the OpenAI chat completions API.
        extra: Arbitrary extra metadata for provider-specific config.

    Example:
        >>> cap = ProviderCapabilities(
        ...     name="openai",
        ...     api_key_name="openai_api_key",
        ...     modalities={Modality.LLM, Modality.IMAGE},
        ...     default_models={Modality.LLM: "gpt-4o-mini", Modality.IMAGE: "dall-e-3"},
        ... )
        >>> Modality.LLM in cap.modalities
        True
    """

    name: str
    api_key_name: str | None = None
    modalities: set[Modality] = Field(default_factory=set)
    default_models: dict[Modality, str] = Field(default_factory=dict)
    base_url: str | None = None
    supports_function_calling: bool = False
    supports_vision: bool = False
    supports_json_mode: bool = False
    supports_streaming: bool = False
    supports_tool_use: bool = False
    openai_compatible: bool = False
    requires_api_key: bool = True
    extra: dict[str, Any] = Field(default_factory=dict)
