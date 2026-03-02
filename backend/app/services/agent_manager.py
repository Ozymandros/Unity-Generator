import logging
import sys
from typing import Any, cast


from ..agents.base import AsyncAgent, SyncAgent
from ..core.config import get_repo_root
from ..schemas import (
    AgentResult,
    AudioOptions,
    CodeOptions,
    ImageOptions,
    TextOptions,
    VideoOptions,
)
from .asset_saver import save_asset_to_project
from .providers import Modality, provider_registry

LOGGER = logging.getLogger(__name__)


class AgentManager:
    code_agent: SyncAgent | None
    text_agent: SyncAgent | None
    image_agent: SyncAgent | None
    audio_agent: SyncAgent | None
    unity_agent: AsyncAgent | None

    def _ensure_agents(self):
        if self.text_agent is not None:
            return
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
        except Exception as e:
            LOGGER.error(f"Failed to load agents: {e}")

    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

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
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.code_agent:
            raise RuntimeError("CodeAgent is not available.")

        # Ensure options is a dict for the agent call
        opts = options.dict() if isinstance(options, CodeOptions) else options

        # Fallback to global preference if no system prompt provided
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("code")

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
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.text_agent:
            raise RuntimeError("TextAgent is not available.")

        opts = options.dict() if isinstance(options, TextOptions) else options

        # Fallback logic for text
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("text")

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
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.image_agent:
            raise RuntimeError("ImageAgent is not available.")

        opts = options.dict() if isinstance(options, ImageOptions) else options

        # Fallback logic for image
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("image")

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
        modality: str | None = None,
    ) -> AgentResult:
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo
        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.audio_agent:
            raise RuntimeError("AudioAgent is not available.")

        opts = options.dict() if isinstance(options, AudioOptions) else options

        # Fallback logic for audio
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            # Check if this is a music provider or TTS provider
            is_music = modality == "music"
            if not is_music:
                from ..core.db import get_pref
                current_provider = provider or get_pref("preferred_audio_provider")
                try:
                    if current_provider:
                        caps = provider_registry.get(current_provider)
                        if caps:
                            is_music = Modality.MUSIC in caps.modalities or caps.extra.get("is_music", False)
                except Exception:
                    pass

            prompt_key = "music" if is_music else "audio"
            effective_system_prompt = get_system_prompt_repo().get(prompt_key)

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
        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        opts = options.model_dump() if isinstance(options, VideoOptions) else options

        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("video")

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
        self._ensure_agents()
        from ..repositories import get_api_key_repo, get_system_prompt_repo

        api_keys = cast(dict[str, str], get_api_key_repo().get_all())
        if provider and api_key:
            caps = provider_registry.get(provider)
            if caps and caps.api_key_name:
                api_keys[caps.api_key_name] = api_key

        if not self.unity_agent:
            raise RuntimeError("UnityAgent is not available.")

        # Fallback logic for unity (default to code prompt since it writes C#)
        effective_system_prompt = system_prompt
        if effective_system_prompt is None:
            effective_system_prompt = get_system_prompt_repo().get("code")

        # UnityAgent.run is async and returns a dict
        result = await self.unity_agent.run(
            prompt, provider, options, api_keys, effective_system_prompt
        )
        # Ensure result is dict for type safety
        if not isinstance(result, dict):
            content = str(result)
            result = {"content": content}
        return AgentResult(
            content=str(result.get("content", "")),
            provider=provider or "unity",
            raw=result if isinstance(result, dict) else None,
            model=str(options.get("model", "")),
        )


# Module-level singleton
agent_manager = AgentManager()
