import logging
import sys
from typing import Any, Dict

from .config import get_repo_root, load_api_keys


LOGGER = logging.getLogger(__name__)


class AgentManager:
    def __init__(self) -> None:
        repo_root = get_repo_root()
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        try:
            from agents import code_agent, text_agent, image_agent, audio_agent
        except ImportError:
            LOGGER.warning("Agents not yet implemented.")
            self.code_agent = None
            self.text_agent = None
            self.image_agent = None
            self.audio_agent = None
            return

        self.code_agent = code_agent
        self.text_agent = text_agent
        self.image_agent = image_agent
        self.audio_agent = audio_agent

    def run_code(self, prompt: str, provider: str | None, options: Dict[str, Any]):
        api_keys = load_api_keys()
        if not self.code_agent:
            raise RuntimeError("CodeAgent is not available.")
        return self.code_agent.run(prompt, provider, options, api_keys)

    def run_text(self, prompt: str, provider: str | None, options: Dict[str, Any]):
        api_keys = load_api_keys()
        if not self.text_agent:
            raise RuntimeError("TextAgent is not available.")
        return self.text_agent.run(prompt, provider, options, api_keys)

    def run_image(self, prompt: str, provider: str | None, options: Dict[str, Any]):
        api_keys = load_api_keys()
        if not self.image_agent:
            raise RuntimeError("ImageAgent is not available.")
        return self.image_agent.run(prompt, provider, options, api_keys)

    def run_audio(self, prompt: str, provider: str | None, options: Dict[str, Any]):
        api_keys = load_api_keys()
        if not self.audio_agent:
            raise RuntimeError("AudioAgent is not available.")
        return self.audio_agent.run(prompt, provider, options, api_keys)
