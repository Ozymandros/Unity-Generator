from __future__ import annotations

from typing import Any

import requests
from semantic_kernel.connectors.ai.text_to_audio_client_base import TextToAudioClientBase
from semantic_kernel.contents.audio_content import AudioContent


class ElevenLabsTextToAudio(TextToAudioClientBase):
    """
    ElevenLabs TextToAudio service implementing Semantic Kernel interface.
    """

    def __init__(self, api_key: str, model_id: str = "eleven_multilingual_v2"):
        super().__init__(ai_model_id=model_id)
        self.api_key = api_key

    async def get_audio_content(
        self,
        text: str,
        settings: Any = None,
        **kwargs: Any
    ) -> AudioContent:
        """
        Generate audio from text using ElevenLabs API.
        """
        voice_id = "21m00Tcm4TlvDq8ikWAM" # Default: Rachel
        if settings and hasattr(settings, "voice"):
            voice_id = settings.voice
        elif isinstance(settings, dict) and "voice" in settings:
            voice_id = settings["voice"]

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        data = {
            "text": text,
            "model_id": self.ai_model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        # For simplicity in this bridge, using requests synchronously inside the async method
        # unless user preferred aiosession, but the previous implementation used requests.
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()

        return AudioContent(
            data=response.content,
            ai_model_id=self.ai_model_id,
            metadata={"provider": "elevenlabs", "voice_id": voice_id}
        )

    async def get_audio_contents(self, text: str, settings: Any = None, **kwargs: Any) -> list[AudioContent]:
        return [await self.get_audio_content(text, settings, **kwargs)]
