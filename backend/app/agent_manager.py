import logging
import sys
from typing import Any, Dict

from .config import get_repo_root, load_api_keys
from services.audio_provider import AUDIO_KEY_MAP
from services.image_provider import IMAGE_KEY_MAP
from services.llm_provider import LLM_KEY_MAP


LOGGER = logging.getLogger(__name__)


from app.schemas import AgentResult, CodeOptions, TextOptions, ImageOptions, AudioOptions


class AgentManager:
    code_agent: Any
    text_agent: Any
    image_agent: Any
    audio_agent: Any

    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        try:
            from agents import code_agent, text_agent, image_agent, audio_agent
            self.code_agent = code_agent
            self.text_agent = text_agent
            self.image_agent = image_agent
            self.audio_agent = audio_agent
        except ImportError:
            LOGGER.warning("Agents not yet implemented.")
            self.code_agent = None
            self.text_agent = None
            self.image_agent = None
            self.audio_agent = None

    def run_code(self, prompt: str, provider: str | None, options: CodeOptions | Dict[str, Any], api_key: str | None = None) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = LLM_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key
        
        if not self.code_agent:
            raise RuntimeError("CodeAgent is not available.")
        
        # Ensure options is a dict for the agent call
        opts = options.dict() if isinstance(options, CodeOptions) else options
        result = self.code_agent.run(prompt, provider, opts, api_keys)
        return AgentResult(**result) if isinstance(result, dict) else result

    def run_text(self, prompt: str, provider: str | None, options: TextOptions | Dict[str, Any], api_key: str | None = None) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = LLM_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.text_agent:
            raise RuntimeError("TextAgent is not available.")
        
        opts = options.dict() if isinstance(options, TextOptions) else options
        result = self.text_agent.run(prompt, provider, opts, api_keys)
        return AgentResult(**result) if isinstance(result, dict) else result

    def run_image(self, prompt: str, provider: str | None, options: ImageOptions | Dict[str, Any], api_key: str | None = None) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = IMAGE_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.image_agent:
            raise RuntimeError("ImageAgent is not available.")
        
        opts = options.dict() if isinstance(options, ImageOptions) else options
        result = self.image_agent.run(prompt, provider, opts, api_keys)
        return AgentResult(**result) if isinstance(result, dict) else result

    def run_audio(self, prompt: str, provider: str | None, options: AudioOptions | Dict[str, Any], api_key: str | None = None) -> AgentResult:
        api_keys = load_api_keys()
        if provider and api_key:
            key_name = AUDIO_KEY_MAP.get(provider)
            if key_name:
                api_keys[key_name] = api_key

        if not self.audio_agent:
            raise RuntimeError("AudioAgent is not available.")
        
        opts = options.dict() if isinstance(options, AudioOptions) else options
        result = self.audio_agent.run(prompt, provider, opts, api_keys)
        return AgentResult(**result) if isinstance(result, dict) else result

