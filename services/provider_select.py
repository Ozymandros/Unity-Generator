from typing import Dict, Iterable, Optional


def select_provider(
    preferred: Optional[str],
    api_keys: Dict[str, str],
    priority: Iterable[str],
    key_map: Dict[str, str],
) -> str:
    if preferred:
        if preferred not in key_map:
            raise RuntimeError(f"Provider {preferred} is not supported")
        key_name = key_map.get(preferred)
        if key_name and api_keys.get(key_name):
            return preferred

    for provider in priority:
        key_name = key_map.get(provider)
        if key_name and api_keys.get(key_name):
            return provider

    raise RuntimeError("No valid API key found for the requested providers.")
