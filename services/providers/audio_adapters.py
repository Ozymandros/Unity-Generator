"""
Concrete audio-generation (TTS) adapter implementations.

Each adapter wraps the HTTP call to a single audio provider and returns
a normalised :class:`AgentResult`.
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import requests
from app.schemas import AgentResult, AudioOptions

from .adapters import BaseProviderAdapter
from .capabilities import Modality

LOGGER = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Helper to coerce options
# ------------------------------------------------------------------


def _to_audio_opts(options: dict[str, Any]) -> AudioOptions:
    """
    Ensure *options* is an :class:`AudioOptions` instance.

    Args:
        options: Raw options dictionary.

    Returns:
        Validated :class:`AudioOptions`.

    Example:
        >>> opts = _to_audio_opts({"voice": "Adam"})
        >>> opts.voice
        'Adam'
    """
    if isinstance(options, AudioOptions):
        return options
    return AudioOptions(**options)


# ------------------------------------------------------------------
# ElevenLabs
# ------------------------------------------------------------------


class ElevenLabsAudioAdapter(BaseProviderAdapter):
    """
    Text-to-speech via the ElevenLabs API.

    Docs: https://docs.elevenlabs.io/api-reference
    """

    def __init__(self) -> None:
        super().__init__(Modality.AUDIO, "elevenlabs")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call the ElevenLabs TTS endpoint.

        Args:
            prompt: Text to synthesise.
            options: Should contain ``voice``, ``model_id``, ``stability``,
                     ``similarity_boost``.
            api_key: ElevenLabs xi-api-key.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with base64-encoded MP3 audio.
        """
        opts = _to_audio_opts(options)
        effective_text = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        voice_id = opts.voice
        model_id = opts.model_id
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": effective_text,
            "model_id": model_id,
            "voice_settings": {
                "stability": opts.stability,
                "similarity_boost": opts.similarity_boost,
            },
        }
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        audio_data = base64.b64encode(response.content).decode("utf-8")
        return AgentResult(audio=audio_data, provider="elevenlabs")


# ------------------------------------------------------------------
# Play.ht
# ------------------------------------------------------------------


class PlayHTAudioAdapter(BaseProviderAdapter):
    """Text-to-speech via the Play.ht API."""

    def __init__(self) -> None:
        super().__init__(Modality.AUDIO, "playht")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Call the Play.ht TTS endpoint.

        Args:
            prompt: Text to synthesise.
            options: Should contain ``voice``, ``format``.
            api_key: Play.ht bearer token.
            system_prompt: Prepended to prompt if provided.

        Returns:
            :class:`AgentResult` with audio URL from Play.ht.
        """
        opts = _to_audio_opts(options)
        effective_text = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        payload = {
            "text": effective_text,
            "voice": opts.voice,
            "output_format": opts.format,
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        response = requests.post(
            "https://api.play.ht/api/v2/tts",
            json=payload, headers=headers, timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return AgentResult(audio=data.get("url"), provider="playht", raw=data)


# ------------------------------------------------------------------
# Stubs (OpenAI TTS, Google TTS)
# ------------------------------------------------------------------


class OpenAIAudioAdapter(BaseProviderAdapter):
    """
    OpenAI TTS adapter (stub).

    Replace ``_do_invoke`` with a real implementation when ready.
    """

    def __init__(self) -> None:
        super().__init__(Modality.AUDIO, "openai")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Return a stub response for OpenAI TTS.

        Args:
            prompt: Text to synthesise (unused in stub).
            options: Audio options (unused in stub).
            api_key: OpenAI API key (unused in stub).
            system_prompt: Optional system message (unused in stub).

        Returns:
            :class:`AgentResult` with a placeholder audio string.
        """
        return AgentResult(audio="openai_audio_stub", provider="openai")


class GoogleAudioAdapter(BaseProviderAdapter):
    """
    Google Cloud TTS adapter (stub).

    Replace ``_do_invoke`` with a real implementation when ready.
    """

    def __init__(self) -> None:
        super().__init__(Modality.AUDIO, "google")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Return a stub response for Google Cloud TTS.

        Args:
            prompt: Text to synthesise (unused in stub).
            options: Audio options (unused in stub).
            api_key: Google API key (unused in stub).
            system_prompt: Optional system message (unused in stub).

        Returns:
            :class:`AgentResult` with a placeholder audio string.
        """
        return AgentResult(audio="google_audio_stub", provider="google")


# ======================================================================
# Adapter lookup table
# ======================================================================

AUDIO_ADAPTERS: dict[str, BaseProviderAdapter] = {
    "elevenlabs": ElevenLabsAudioAdapter(),
    "openai": OpenAIAudioAdapter(),
    "google": GoogleAudioAdapter(),
    "playht": PlayHTAudioAdapter(),
}
