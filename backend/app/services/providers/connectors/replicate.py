from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import requests
from semantic_kernel.connectors.ai.text_to_image_client_base import TextToImageClientBase
from semantic_kernel.connectors.ai.text_to_audio_client_base import TextToAudioClientBase
from semantic_kernel.contents.audio_content import AudioContent

LOGGER = logging.getLogger(__name__)

class ReplicateConnectorBase:
    """Base class for Replicate API interactions using prediction polling."""
    def __init__(self, api_key: str, model_id: str):
        self.api_key = api_key
        self.model_id = model_id
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _create_prediction(self, input_data: dict[str, Any]) -> str:
        """Create a prediction and return the prediction ID/URL."""
        # Replicate models can be referenced by 'owner/name' or 'owner/name:version'
        # If it's just 'owner/name', we might need to resolve the latest version or use a different endpoint.
        # For simplicity, we assume model_id is usable in the URL if formatted correctly.
        # The recommended way is POST https://api.replicate.com/v1/models/{model_id}/predictions
        url = f"https://api.replicate.com/v1/models/{self.model_id}/predictions"
        
        response = requests.post(url, headers=self.headers, json={"input": input_data})
        if response.status_code == 404:
            # Fallback to generic predictions endpoint if model-specific fails
            url = "https://api.replicate.com/v1/predictions"
            response = requests.post(url, headers=self.headers, json={
                "version": self.model_id.split(":")[-1] if ":" in self.model_id else None,
                "input": input_data
            })
            
        response.raise_for_status()
        return response.json()["urls"]["get"]

    async def _poll_prediction(self, get_url: str, timeout: int = 60) -> Any:
        """Poll the prediction until it's finished."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            response = requests.get(get_url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            if data["status"] == "succeeded":
                return data["output"]
            elif data["status"] in ["failed", "canceled"]:
                raise RuntimeError(f"Replicate prediction {data['status']}: {data.get('error')}")
            
            await asyncio.sleep(2)
        
        raise TimeoutError("Replicate prediction timed out")

class ReplicateTextToImage(TextToImageClientBase, ReplicateConnectorBase):
    """Replicate TextToImage service (e.g. for Flux)."""
    def __init__(self, api_key: str, model_id: str):
        # We need to call both inits. Pydantic/SK bases can be tricky.
        # TextToImageClientBase usually expects ai_model_id in its own __init__
        super().__init__(ai_model_id=model_id)
        ReplicateConnectorBase.__init__(self, api_key=api_key, model_id=model_id)

    async def generate_image(
        self,
        description: str,
        width: int,
        height: int,
        **kwargs: Any
    ) -> str:
        input_data = {
            "prompt": description,
            "width": width,
            "height": height,
        }
        # Flux Schnell specific defaults if needed, but Flux usually just takes prompt
        try:
            get_url = await self._create_prediction(input_data)
            output = await self._poll_prediction(get_url)
            
            # Replicate output for images is usually a list of strings (URLs)
            if isinstance(output, list) and len(output) > 0:
                return output[0]
            return str(output)
        except Exception as e:
            LOGGER.error(f"Replicate image generation failed: {e}")
            raise

class ReplicateTextToAudio(TextToAudioClientBase, ReplicateConnectorBase):
    """Replicate TextToAudio service (e.g. for MusicGen)."""
    def __init__(self, api_key: str, model_id: str):
        super().__init__(ai_model_id=model_id)
        ReplicateConnectorBase.__init__(self, api_key=api_key, model_id=model_id)

    async def get_audio_content(
        self,
        text: str,
        settings: Any = None,
        **kwargs: Any
    ) -> AudioContent:
        # MusicGen expects 'prompt'
        input_data = {"prompt": text}
        
        try:
            get_url = await self._create_prediction(input_data)
            output = await self._poll_prediction(get_url)
            
            # Replicate musicgen usually returns a URL to the audio file
            audio_url = output if isinstance(output, str) else output[0]
            
            # Fetch the actual bytes
            resp = requests.get(audio_url)
            resp.raise_for_status()
            
            return AudioContent(
                data=resp.content,
                ai_model_id=self.model_id,
                metadata={"provider": "replicate", "audio_url": audio_url}
            )
        except Exception as e:
            LOGGER.error(f"Replicate audio generation failed: {e}")
            raise

    async def get_audio_contents(self, text: str, settings: Any = None, **kwargs: Any) -> list[AudioContent]:
        return [await self.get_audio_content(text, settings, **kwargs)]
