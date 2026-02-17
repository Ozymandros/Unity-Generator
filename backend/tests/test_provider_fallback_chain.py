"""
Tests for the provider fallback chain.

Ensures that the registry-based ``resolve`` + adapter dispatch
correctly falls back across providers when the preferred one has
no key or fails.
"""

from unittest.mock import MagicMock, patch

import pytest
from services.audio_provider import generate_audio
from services.image_provider import generate_image
from services.llm_provider import generate_text
from services.providers import (
    Modality,
    ProviderNotAvailableError,
    ProviderNotSupportedError,
    provider_registry,
)


class TestLLMFallbackChain:
    """Test LLM provider fallback via generate_text."""

    @patch("services.providers.llm_adapters.requests.post")
    def test_fallback_when_preferred_has_no_key(self, mock_post: MagicMock) -> None:
        """If preferred provider has no key, fall back to next with key."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "fallback answer"}}]
        }

        # Only openai has a key; deepseek is preferred but missing
        api_keys = {"openai_api_key": "sk-test"}
        result = generate_text("hi", "deepseek", {}, api_keys)

        assert result.provider == "openai"
        assert result.content == "fallback answer"

    @patch("services.providers.llm_adapters.requests.post")
    def test_first_priority_used_when_no_preference(self, mock_post: MagicMock) -> None:
        """With no preferred provider the highest-priority one with a key wins."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "ok"}}]
        }

        api_keys = {"groq_api_key": "g-test", "openai_api_key": "sk-test"}
        result = generate_text("hi", None, {}, api_keys)

        # openai is higher priority than groq in the default registry
        assert result.provider == "openai"

    def test_no_keys_at_all_raises(self) -> None:
        """generate_text raises when no LLM provider has a key."""
        with pytest.raises(ProviderNotAvailableError):
            generate_text("hi", None, {}, {})


class TestImageFallbackChain:
    """Test image provider fallback via generate_image."""

    @patch("services.providers.image_adapters.requests.post")
    def test_fallback_to_next_image_provider(self, mock_post: MagicMock) -> None:
        """Stability is preferred but missing key; falls back to openai."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "data": [{"b64_json": "img", "revised_prompt": "p"}]
        }

        api_keys = {"openai_api_key": "sk-test"}
        result = generate_image("a cat", "stability", {}, api_keys)
        assert result.provider == "openai"


class TestAudioFallbackChain:
    """Test audio provider fallback via generate_audio."""

    def test_audio_stub_fallback(self) -> None:
        """ElevenLabs preferred but no key; Google has key -> Google stub."""
        api_keys = {"google_api_key": "goog-test"}
        result = generate_audio("hello", "elevenlabs", {}, api_keys)
        assert result.provider == "google"
        assert "stub" in (result.audio or "")


class TestVideoFallbackChain:
    """Test video provider resolution."""

    def test_video_no_keys_raises(self) -> None:
        """Video resolve raises when no video provider has a key."""
        with pytest.raises(ProviderNotAvailableError):
            provider_registry.resolve(Modality.VIDEO, {})

    def test_video_resolve_with_key(self) -> None:
        """Video resolve returns the first provider with a key."""
        selected = provider_registry.resolve(
            Modality.VIDEO, {"runway_api_key": "r-key"}
        )
        assert selected == "runway"


class TestCrossModalityErrors:
    """Verify that asking a provider for the wrong modality raises."""

    def test_llm_provider_for_image_raises(self) -> None:
        with pytest.raises(ProviderNotSupportedError, match="does not support"):
            provider_registry.resolve(
                Modality.IMAGE,
                {"groq_api_key": "g-test"},
                preferred="groq",
            )

    def test_image_provider_for_audio_raises(self) -> None:
        with pytest.raises(ProviderNotSupportedError, match="does not support"):
            provider_registry.resolve(
                Modality.AUDIO,
                {"stability_api_key": "s-test"},
                preferred="stability",
            )
