import logging
import sys
from typing import Any

from services.audio_provider import AUDIO_KEY_MAP
from services.image_provider import IMAGE_KEY_MAP
from services.llm_provider import LLM_KEY_MAP

from app.db import get_pref
from app.schemas import (
    AgentResult,
    AudioOptions,
    CodeOptions,
    ImageOptions,
    TextOptions,
)

from .asset_saver import save_asset_to_project
from .config import get_repo_root, load_api_keys

LOGGER = logging.getLogger(__name__)


class AgentManager:
    code_agent: Any
    text_agent: Any
    image_agent: Any
    text_agent: Any
    image_agent: Any
    audio_agent: Any
    unity_agent: Any

    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        try:
            from agents import audio_agent, code_agent, image_agent, text_agent, unity_agent

            self.code_agent = code_agent
            self.text_agent = text_agent
            self.image_agent = image_agent
            self.audio_agent = audio_agent
            self.unity_agent = unity_agent()  # Initialize the class
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

        result = self.code_agent.run(prompt, provider, opts, api_keys, effective_system_prompt)
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

        result = self.text_agent.run(prompt, provider, opts, api_keys, effective_system_prompt)
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

        result = self.image_agent.run(prompt, provider, opts, api_keys, effective_system_prompt)
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

        result = self.audio_agent.run(prompt, provider, opts, api_keys, effective_system_prompt)
        final_result = AgentResult(**result) if isinstance(result, dict) else result

        if project_path:
            save_asset_to_project(project_path, "audio", final_result)

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
        result = await self.unity_agent.run(prompt, provider, options, api_keys, effective_system_prompt)
        return AgentResult(**result)
