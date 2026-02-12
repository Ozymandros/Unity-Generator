from typing import Any, Dict, Optional, Union
import requests
from .provider_select import select_provider
from app.schemas import AgentResult, TextOptions, CodeOptions


LLM_KEY_MAP = {
    "google": "google_api_key",
    "anthropic": "anthropic_api_key",
    "deepseek": "deepseek_api_key",
    "openrouter": "openrouter_api_key",
    "openai": "openai_api_key",
    "groq": "groq_api_key",
}

LLM_PRIORITY = ["google", "anthropic", "deepseek", "openrouter", "openai", "groq"]


def generate_text(
    prompt: str,
    provider: Optional[str],
    options: Union[TextOptions, CodeOptions, Dict[str, Any]],
    api_keys: Dict[str, str],
) -> AgentResult:
    selected = select_provider(provider, api_keys, LLM_PRIORITY, LLM_KEY_MAP)
    
    # Core logic: if options is a model, we can still treat it like a model.
    # If it's a dict, we might want to coerce, but for LLMs generic temperature/max_tokens are common.
    
    if selected == "google":
        return _call_google(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "anthropic":
        return _call_anthropic(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "openai":
        return _call_openai(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "deepseek":
        return _call_deepseek(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "openrouter":
        return _call_openrouter(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "groq":
        return _call_groq(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported LLM provider: {selected}")


def _call_openai(prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str) -> AgentResult:
    url = "https://api.openai.com/v1/chat/completions"
    
    # Safer access for both models and dicts
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "gpt-4o-mini")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": get_opt("temperature", 0.7),
        "max_tokens": get_opt("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return AgentResult(content=content, provider="openai", model=model)


def _call_deepseek(
    prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str
) -> AgentResult:
    url = "https://api.deepseek.com/v1/chat/completions"
    
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "deepseek-chat")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": get_opt("temperature", 0.7),
        "max_tokens": get_opt("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return AgentResult(content=content, provider="deepseek", model=model)


def _call_openrouter(
    prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str
) -> AgentResult:
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "openrouter/auto")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": get_opt("temperature", 0.7),
        "max_tokens": get_opt("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return AgentResult(content=content, provider="openrouter", model=model)


def _call_google(prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str) -> AgentResult:
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "gemini-1.5-flash")
    return AgentResult(content=f"[Google {model} stub] Prompt: {prompt}", provider="google", model=model)


def _call_anthropic(prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str) -> AgentResult:
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "claude-3-5-sonnet-20240620")
    return AgentResult(content=f"[Anthropic {model} stub] Prompt: {prompt}", provider="anthropic", model=model)


def _call_groq(prompt: str, options: Union[TextOptions, CodeOptions, Dict[str, Any]], api_key: str) -> AgentResult:
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    def get_opt(key: str, default: Any) -> Any:
        if isinstance(options, dict):
            return options.get(key, default)
        return getattr(options, key, default)

    model = get_opt("model", "llama-3.1-8b-instant")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": get_opt("temperature", 0.7),
        "max_tokens": get_opt("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return AgentResult(content=content, provider="groq", model=model)

