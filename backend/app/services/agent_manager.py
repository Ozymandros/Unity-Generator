import logging
import sys
from typing import Any

from ..agents.base import AsyncAgent, SyncAgent
from ..core.config import get_repo_root, load_api_keys
from ..core.db import get_pref
from ..schemas import (
    AgentResult,
    AudioOptions,
    CodeOptions,
    ImageOptions,
    TextOptions,
    VideoOptions,
)
from .asset_saver import save_asset_to_project
from .audio_provider import AUDIO_KEY_MAP
from .image_provider import IMAGE_KEY_MAP
from .llm_provider import LLM_KEY_MAP
from .video_provider import VIDEO_KEY_MAP

LOGGER = logging.getLogger(__name__)


class AgentManager:
    code_agent: SyncAgent | None
    text_agent: SyncAgent | None
    image_agent: SyncAgent | None
    audio_agent: SyncAgent | None
    unity_agent: AsyncAgent | None

    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        try:
            from ..agents import (
                AudioAgent,
                CodeAgent,
                ImageAgent,
                TextAgent,
                UnityAgent,
            )

            self.code_agent = CodeAgent()
            self.text_agent = TextAgent()
            self.image_agent = ImageAgent()
            self.audio_agent = AudioAgent()
            self.unity_agent = UnityAgent()
        except ImportError:
            LOGGER.warning("Agents not yet implemented.")
            self.code_agent = None
            self.text_agent = None
            self.image_agent = None
            self.audio_agent = None
            self.unity_agent = None
        except Exception as e:
            LOGGER.debug(f"Could not register fallback skills: {e}")
            self.code_agent = None
            self.text_agent = None
            self.image_agent = None
            self.audio_agent = None
            self.unity_agent = None

    def run_code(
        self,
        prompt: str,
        provider: str | None,
        options: CodeOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = LLM_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.code_agent:
            raise RuntimeError("CodeAgent is not available.")

        # Ensure options is a dict for the agent call
        opts = options.dict() if isinstance(options, CodeOptions) else options

        # Fallback to global preference if no system prompt provided
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_code_system_prompt")

        result = self.code_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        # Wrap result if it's a dict
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "code", final_result)

        return final_result

    def run_text(
        self,
        prompt: str,
        provider: str | None,
        options: TextOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = LLM_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.text_agent:
            raise RuntimeError("TextAgent is not available.")

        opts = options.dict() if isinstance(options, TextOptions) else options

        # Fallback logic for text
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_text_system_prompt")

        result = self.text_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "text", final_result)

        return final_result

    def run_image(
        self,
        prompt: str,
        provider: str | None,
        options: ImageOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = IMAGE_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.image_agent:
            raise RuntimeError("ImageAgent is not available.")

        opts = options.dict() if isinstance(options, ImageOptions) else options

        # Fallback logic for image
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_image_system_prompt")

        result = self.image_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "image", final_result)

        return final_result

    def run_audio(
        self,
        prompt: str,
        provider: str | None,
        options: AudioOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = AUDIO_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.audio_agent:
            raise RuntimeError("AudioAgent is not available.")

        opts = options.dict() if isinstance(options, AudioOptions) else options

        # Fallback logic for audio
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_audio_system_prompt")

        result = self.audio_agent.run(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "audio", final_result)

        return final_result

    def run_video(
        self,
        prompt: str,
        provider: str | None,
        options: VideoOptions | dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
        project_path: str | None = None,
    ) -> AgentResult:
        """
        Generate a video using the video provider service.

        Args:
            prompt: Description of the desired video.
            provider: Optional provider override.
            options: Video generation options.
            api_key: Optional per-request API key override.
            system_prompt: Optional system prompt.
            project_path: Optional path to save asset into.

        Returns:
            :class:`AgentResult` with video data.

        Raises:
            RuntimeError: If no video provider is available.

        Example:
            >>> manager = AgentManager()
            >>> result = manager.run_video("A sunrise", "runway", {})
            ... # doctest: +SKIP
        """
        from services.video_provider import generate_video

        api_keys = load_api_keys()
        if provider and api_key:
            key_name = VIDEO_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        opts = options.model_dump() if isinstance(options, VideoOptions) else options

        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_video_system_prompt")

        result = generate_video(
            prompt, provider, opts, api_keys, effective_system_prompt
        )
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "video", final_result)

        return final_result

    async def run_unity(
        self,
        prompt: str,
        provider: str | None,
        options: dict[str, Any],
        api_key: str | None = None,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Runs the Unity Agent to orchestrate editor actions.
        """
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = LLM_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.unity_agent:
            raise RuntimeError("UnityAgent is not available.")

        # Fallback logic for unity (default to code prompt since it writes C#)
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_pref("default_code_system_prompt")

        # UnityAgent.run is async and returns a dict
        result = await self.unity_agent.run(
            prompt, provider, options, api_keys, effective_system_prompt
        )
        return AgentResult(
            content=result.get("content", ""),
            provider=provider or "unity",
            raw=result,
            model=options.get("model"),
        )


# Module-level singleton
agent_manager = AgentManager()
