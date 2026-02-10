
import pytest
from services.provider_select import select_provider

def test_select_provider_preferred_available():
    """Test when the preferred provider has an API key."""
    api_keys = {"openai_api_key": "sk-test"}
    priority = ["deepseek", "openai"]
    key_map = {"openai": "openai_api_key", "deepseek": "deepseek_api_key"}
    
    selected = select_provider("openai", api_keys, priority, key_map)
    assert selected == "openai"

def test_select_provider_preferred_missing_falls_back():
    """Test when preferred provider has no key, it falls back to priority."""
    api_keys = {"openai_api_key": "sk-test"}
    priority = ["deepseek", "openai"]
    key_map = {"openai": "openai_api_key", "deepseek": "deepseek_api_key"}
    
    # deepseek has no key, so it should fall back to openai
    selected = select_provider("deepseek", api_keys, priority, key_map)
    assert selected == "openai"

def test_select_provider_no_preferred_uses_priority():
    """Test when no preferred provider is specified, it uses priority list."""
    api_keys = {"openai_api_key": "sk-test"}
    priority = ["deepseek", "openai"]
    key_map = {"openai": "openai_api_key", "deepseek": "deepseek_api_key"}
    
    selected = select_provider(None, api_keys, priority, key_map)
    assert selected == "openai"

def test_select_provider_no_keys_raises_error():
    """Test that it raises RuntimeError when no keys are available."""
    api_keys = {}
    priority = ["openai"]
    key_map = {"openai": "openai_api_key"}
    
    with pytest.raises(RuntimeError, match="No valid API key found"):
        select_provider(None, api_keys, priority, key_map)
