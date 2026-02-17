import pytest
from app.services.provider_select import select_provider


def test_get_provider_for_request_all_fallbacks() -> None:
    """Ensure it falls back to OpenAI if no preference is set in DB."""
    api_keys: dict[str, str] = {"openai_api_key": "sk-test"}
    priority: list[str] = ["deepseek", "openai"]
    key_map: dict[str, str] = {
        "openai": "openai_api_key",
        "deepseek": "deepseek_api_key",
    }

    selected: str = select_provider("openai", api_keys, priority, key_map)
    assert selected == "openai"


def test_select_provider_preferred_missing_falls_back() -> None:
    """Test when preferred provider has no key, it falls back to priority."""
    api_keys: dict[str, str] = {"openai_api_key": "sk-test"}
    priority: list[str] = ["deepseek", "openai"]
    key_map: dict[str, str] = {
        "openai": "openai_api_key",
        "deepseek": "deepseek_api_key",
    }

    # deepseek has no key, so it should fall back to openai
    selected: str = select_provider("deepseek", api_keys, priority, key_map)
    assert selected == "openai"


def test_select_provider_no_preferred_uses_priority() -> None:
    """Test when no preferred provider is specified, it uses priority list."""
    api_keys: dict[str, str] = {"openai_api_key": "sk-test"}
    priority: list[str] = ["deepseek", "openai"]
    key_map: dict[str, str] = {
        "openai": "openai_api_key",
        "deepseek": "deepseek_api_key",
    }

    selected: str = select_provider(None, api_keys, priority, key_map)
    assert selected == "openai"


def test_select_provider_no_keys_raises_error() -> None:
    """Test that it raises RuntimeError when no keys are available."""
    api_keys: dict[str, str] = {}
    priority: list[str] = ["openai"]
    key_map: dict[str, str] = {"openai": "openai_api_key"}

    with pytest.raises(RuntimeError, match="No valid API key found"):
        select_provider(None, api_keys, priority, key_map)


def test_get_provider_for_request_explicit() -> None:
    """Test explicit provider selection."""
    keys: dict[str, str] = {"k1": "v1"}
    priority: list[str] = ["p1", "p2"]
    key_map: dict[str, str] = {"p1": "k1", "p2": "k2"}

    assert select_provider("p1", keys, priority, key_map) == "p1"


def test_get_provider_for_request_db_fallback() -> None:
    """Test fallback based on priority when explicit is None."""
    keys: dict[str, str] = {"k2": "v2"}
    priority: list[str] = ["p1", "p2"]
    key_map: dict[str, str] = {"p1": "k1", "p2": "k2"}

    assert select_provider(None, keys, priority, key_map) == "p2"


def test_select_provider_raises_when_no_keys() -> None:
    """Test RuntimeError when no priorities have keys."""
    api_keys: dict[str, str] = {"other": "key"}
    priority = ["p1"]
    key_map = {"p1": "k1"}

    with pytest.raises(RuntimeError, match="No valid API key found"):
        select_provider(None, api_keys, priority, key_map)


def test_select_provider_raises_for_unsupported_explicit() -> None:
    """Test RuntimeError for unsupported provider with key."""
    keys: dict[str, str] = {"k1": "v1"}
    priority = ["p1"]
    key_map = {"p1": "k1"}

    with pytest.raises(RuntimeError, match="not supported"):
        select_provider("unsupported", keys, priority, key_map)
