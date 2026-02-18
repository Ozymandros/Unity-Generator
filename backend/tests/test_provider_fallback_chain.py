"""
Tests for the provider fallback chain using SK mocks.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.audio_provider import generate_audio
from app.services.image_provider import generate_image
from app.services.llm_provider import generate_text
from app.services.providers import (
    Modality,
    ProviderNotAvailableError,
    ProviderNotSupportedError,
    provider_registry,
)


class TestLLMFallbackChain:
    """Test LLM provider fallback via generate_text."""

    @patch("app.services.providers.registry.provider_registry.create_chat_service")
    def test_fallback_when_preferred_has_no_key(self, mock_create: MagicMock) -> None:
        """If preferred provider has no key, fall back to next with key."""
        mock_service = AsyncMock()
        mock_service.get_chat_message_content.return_value = "fallback answer"
        mock_create.return_value = mock_service

        # Only openai has a key; deepseek is preferred but missing
        api_keys = {"openai_api_key": "sk-test"}
        result = generate_text("hi", "deepseek", {}, api_keys)

        assert result.provider == "openai"
        assert result.content == "fallback answer"

    @patch("app.services.providers.registry.provider_registry.create_chat_service")
    def test_first_priority_used_when_no_preference(self, mock_create: MagicMock) -> None:
        """With no preferred provider the highest-priority one with a key wins."""
        mock_service = AsyncMock()
        mock_service.get_chat_message_content.return_value = "ok"
        mock_create.return_value = mock_service

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

    @patch("app.services.providers.registry.provider_registry.create_text_to_image_service")
    def test_fallback_to_next_image_provider(self, mock_create: MagicMock) -> None:
        """Stability is preferred but missing key; falls back to openai."""
        mock_service = AsyncMock()
        mock_service.generate_image.return_value = "img_url"
        mock_create.return_value = mock_service

        api_keys = {"openai_api_key": "sk-test"}
        result = generate_image("a cat", "stability", {}, api_keys)
        assert result.provider == "openai"


class TestAudioFallbackChain:
    """Test audio provider fallback via generate_audio."""

    @patch("app.services.providers.registry.provider_registry.create_text_to_audio_service")
    def test_audio_stub_fallback(self, mock_create: MagicMock) -> None:
        """ElevenLabs preferred but no key; Google has key -> Google."""
        mock_service = AsyncMock()
        mock_content = MagicMock()
        mock_content.data = b"audio"
        mock_content.uri = None
        mock_content.metadata = {}
        mock_service.get_audio_content.return_value = mock_content
        mock_create.return_value = mock_service

        api_keys = {"google_api_key": "goog-test"}
        result = generate_audio("hello", "elevenlabs", {}, api_keys)
        assert result.provider == "google"


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
