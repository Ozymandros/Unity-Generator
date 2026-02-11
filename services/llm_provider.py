from typing import Any, Dict, Optional

import requests

from .provider_select import select_provider


LLM_KEY_MAP = {
    "deepseek": "deepseek_api_key",
    "openrouter": "openrouter_api_key",
    "openai": "openai_api_key",
    "groq": "groq_api_key",
}

LLM_PRIORITY = ["deepseek", "openrouter", "openai", "groq"]


def generate_text(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    selected = select_provider(provider, api_keys, LLM_PRIORITY, LLM_KEY_MAP)
    if selected == "openai":
        return _call_openai(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "deepseek":
        return _call_deepseek(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "openrouter":
        return _call_openrouter(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    if selected == "groq":
        return _call_groq(prompt, options, api_keys[LLM_KEY_MAP[selected]])
    raise RuntimeError(f"Unsupported LLM provider: {selected}")


def _call_openai(prompt: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.openai.com/v1/chat/completions"
    model = options.get("model", "gpt-4o-mini")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": options.get("temperature", 0.7),
        "max_tokens": options.get("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return {"content": content, "provider": "openai", "model": model}


def _call_deepseek(
    prompt: str, options: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    url = "https://api.deepseek.com/v1/chat/completions"
    model = options.get("model", "deepseek-chat")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": options.get("temperature", 0.7),
        "max_tokens": options.get("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return {"content": content, "provider": "deepseek", "model": model}


def _call_openrouter(
    prompt: str, options: Dict[str, Any], api_key: str
) -> Dict[str, Any]:
    url = "https://openrouter.ai/api/v1/chat/completions"
    model = options.get("model", "openrouter/auto")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": options.get("temperature", 0.7),
        "max_tokens": options.get("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return {"content": content, "provider": "openrouter", "model": model}


def _call_groq(prompt: str, options: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    url = "https://api.groq.com/openai/v1/chat/completions"
    model = options.get("model", "llama-3.1-8b-instant")
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": options.get("temperature", 0.7),
        "max_tokens": options.get("max_tokens", 2048),
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return {"content": content, "provider": "groq", "model": model}
