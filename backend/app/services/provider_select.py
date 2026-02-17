from collections.abc import Iterable


def select_provider(
    preferred: str | None,
    api_keys: dict[str, str],
    priority: Iterable[str],
    key_map: dict[str, str],
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
