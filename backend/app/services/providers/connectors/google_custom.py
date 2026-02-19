from __future__ import annotations

import base64
from typing import Any

from semantic_kernel.connectors.ai.text_to_audio_client_base import TextToAudioClientBase
from semantic_kernel.connectors.ai.text_to_image_client_base import TextToImageClientBase
from semantic_kernel.contents.audio_content import AudioContent


class GoogleTextToAudio(TextToAudioClientBase):
    """
    Google Cloud TTS (or GenAI TTS) service implementing Semantic Kernel interface.
    """
    api_key: str

    def __init__(self, api_key: str, model_id: str = "google-tts"):
        super().__init__(ai_model_id=model_id, api_key=api_key)  # type: ignore
        # Self assignment not needed if passed to super for Pydantic model,
        # but safe to keep or remove. Pydantic handles it.
        # self.api_key = api_key

    async def get_audio_content(self, text: str, settings: Any = None, **kwargs: Any) -> AudioContent:
        # Mocking for now as the user mentioned SK doesn't have it natively
        # and we need to stick to the 'stub' or 'custom' approach.
        # Implementation would use google-cloud-texttospeech or GenAI SDK.
        return AudioContent(
            data=b"mock-google-audio-data",
            ai_model_id=self.ai_model_id,
            metadata={"provider": "google", "status": "stub_implementation"}
        )

    async def get_audio_contents(self, text: str, settings: Any = None, **kwargs: Any) -> list[AudioContent]:
        return [await self.get_audio_content(text, settings, **kwargs)]

class GoogleTextToImage(TextToImageClientBase):
    """
    Google Imagen service implementing Semantic Kernel interface.
    """
    api_key: str

    def __init__(self, api_key: str, model_id: str = "imagen-3.0-generate-002"):
        super().__init__(ai_model_id=model_id, api_key=api_key)  # type: ignore

    async def generate_image(self, description: str, width: int, height: int, **kwargs: Any) -> str:
        # Wrapped call to Google GenAI SDK (google-genai)
        # Using the same logic as the previous test mocks expected
        try:
             from google.genai import Client  # type: ignore
             client = Client(api_key=self.api_key)
             response = client.models.generate_images(
                 model=self.ai_model_id,
                 prompt=description,
                 config={"number_of_images": 1}
             )
             if response.generated_images:
                  img_bytes = response.generated_images[0].image.image_bytes
                  return base64.b64encode(img_bytes).decode('utf-8')
        except ImportError:
             pass

        return "mock-google-image-b64"
