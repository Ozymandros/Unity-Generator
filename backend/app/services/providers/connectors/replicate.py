from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING, Any

import requests
from pydantic import ConfigDict
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.prompt_execution_settings import PromptExecutionSettings
from semantic_kernel.connectors.ai.text_to_image_client_base import TextToImageClientBase
from semantic_kernel.connectors.ai.text_to_audio_client_base import TextToAudioClientBase
from semantic_kernel.contents.audio_content import AudioContent
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents.utils.author_role import AuthorRole

if TYPE_CHECKING:
    from semantic_kernel.contents.chat_history import ChatHistory

LOGGER = logging.getLogger(__name__)

class ReplicateConnectorBase:
    """Base class for Replicate API interactions using prediction polling."""

    # Annotated for type checkers; set in __init__ via object.__setattr__ (so Pydantic subclasses work).
    api_key: str = ""
    model_id: str = ""
    headers: dict[str, str] | None = None

    def __init__(self, api_key: str, model_id: str):
        object.__setattr__(self, "api_key", api_key)
        object.__setattr__(self, "model_id", model_id)
        object.__setattr__(
            self,
            "headers",
            {
                "Authorization": f"Token {api_key}",
                "Content-Type": "application/json",
            },
        )

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

    async def _poll_prediction(self, get_url: str, timeout: int = 120) -> Any:
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


def _chat_history_to_prompt(chat_history: "ChatHistory") -> str:
    """Convert SK chat history to a single prompt string for Replicate LLaMA-style models."""
    if not chat_history.messages:
        return ""
    parts = []
    for msg in chat_history.messages:
        role = getattr(msg.role, "value", str(msg.role))
        content = getattr(msg, "content", None) or ""
        if isinstance(content, str):
            parts.append(f"{role}: {content}")
    return "\n".join(parts)


class ReplicateChatCompletion(ChatCompletionClientBase, ReplicateConnectorBase):
    """Replicate chat completion via the predictions API (e.g. meta/llama-2-7b)."""

    model_config = ConfigDict(extra="allow")  # allow api_key, model_id, headers from ReplicateConnectorBase

    def __init__(self, api_key: str, model_id: str, service_id: str | None = None):
        ChatCompletionClientBase.__init__(
            self,
            ai_model_id=model_id,
            service_id=service_id or model_id,
        )
        # ReplicateConnectorBase.__init__ uses object.__setattr__ so Pydantic doesn't reject api_key/model_id/headers.
        ReplicateConnectorBase.__init__(self, api_key=api_key, model_id=model_id)

    def get_prompt_execution_settings_class(self) -> type[PromptExecutionSettings]:
        return PromptExecutionSettings

    async def _inner_get_chat_message_contents(
        self,
        chat_history: "ChatHistory",
        settings: PromptExecutionSettings,
    ) -> list[ChatMessageContent]:
        prompt = _chat_history_to_prompt(chat_history)
        if not prompt.strip():
            return [
                ChatMessageContent(
                    role=AuthorRole.ASSISTANT,
                    content="No input provided.",
                    ai_model_id=self.ai_model_id,
                )
            ]
        max_tokens = getattr(settings, "max_tokens", None) or settings.extension_data.get("max_tokens", 500)
        temperature = getattr(settings, "temperature", None) or settings.extension_data.get("temperature", 0.7)
        input_data: dict[str, Any] = {
            "prompt": prompt,
            "max_new_tokens": max(1, int(max_tokens)),
            "temperature": float(temperature),
        }
        try:
            get_url = await self._create_prediction(input_data)
            output = await self._poll_prediction(get_url)
        except Exception as e:
            LOGGER.error("Replicate chat completion failed: %s", e)
            raise
        if isinstance(output, list):
            text = "".join(str(x) for x in output) if output else ""
        else:
            text = str(output)
        return [
            ChatMessageContent(
                role=AuthorRole.ASSISTANT,
                content=text,
                ai_model_id=self.ai_model_id,
            )
        ]

    async def _inner_get_streaming_chat_message_contents(
        self,
        chat_history: "ChatHistory",
        settings: PromptExecutionSettings,
        function_invoke_attempt: int = 0,
    ):  # noqa: ARG002
        raise NotImplementedError("Replicate chat streaming is not implemented.")
        yield  # unreachable; makes this an async generator so the base can async for over it


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
                ai_model_id=self.ai_model_id,
                metadata={"provider": "replicate", "audio_url": audio_url}
            )
        except Exception as e:
            LOGGER.error(f"Replicate audio generation failed: {e}")
            raise

    async def get_audio_contents(self, text: str, settings: Any = None, **kwargs: Any) -> list[AudioContent]:
        return [await self.get_audio_content(text, settings, **kwargs)]
