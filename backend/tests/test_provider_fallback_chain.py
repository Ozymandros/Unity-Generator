"""
Tests for the provider fallback chain.

Ensures that the registry-based ``resolve`` + adapter dispatch
correctly falls back across providers when the preferred one has
no key or fails.
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

    def test_fallback_when_preferred_has_no_key(self) -> None:
        """If preferred provider has no key, fall back to next with key."""
        # Only openai has a key; deepseek is preferred but missing
        api_keys = {"openai": "sk-test"}

        # Mock the service creation to return a mock service that returns our expected content
        with patch("app.services.providers.registry.ProviderRegistry.create_chat_service") as mock_create:
            mock_service = MagicMock()

            # Helper to create a mock response that behaves like SK ChatMessageContent
            mock_response = MagicMock(content="fallback answer")
            mock_response.__str__.return_value = "fallback answer"  # type: ignore

            mock_service.get_chat_message_content = AsyncMock(return_value=mock_response)
            mock_create.return_value = mock_service

            # Since generate_text creates a Kernel and adds the service, we verify via the result
            # We assume generate_text calls 'create_chat_service' with the resolved provider.

            result = generate_text("hi", "deepseek", {}, api_keys)

            # Verification:
            # 1. generate_text should have resolved to "openai" because "deepseek" had no key
            assert result.provider == "openai"
            assert result.content == "fallback answer"

            # 2. create_chat_service should have been called for "openai"
            mock_create.assert_called_once()
            args, kwargs = mock_create.call_args
            assert args[0] == "openai"

    def test_first_priority_used_when_no_preference(self) -> None:
        """With no preferred provider the highest-priority one with a key wins."""
        api_keys = {"groq": "g-test", "openai": "sk-test"}

        with patch("app.services.providers.registry.ProviderRegistry.create_chat_service") as mock_create:
            mock_service = MagicMock()

            mock_response = MagicMock(content="ok")
            mock_response.__str__.return_value = "ok"  # type: ignore

            mock_service.get_chat_message_content = AsyncMock(return_value=mock_response)
            mock_create.return_value = mock_service

            result = generate_text("hi", None, {}, api_keys)

            # openai is higher priority than groq in default registry
            assert result.provider == "openai"

            mock_create.assert_called()
            args, kwargs = mock_create.call_args
            assert args[0] == "openai"


class TestImageFallbackChain:
    """Test image provider fallback via generate_image."""

    def test_fallback_to_next_image_provider(self) -> None:
        """Stability is preferred but missing key; falls back to openai."""
        api_keys = {"openai": "sk-test"}

        with patch("app.services.providers.registry.ProviderRegistry.create_text_to_image_service") as mock_create:
            mock_service = MagicMock()
            mock_service.generate_image = AsyncMock(return_value="http://openai-image")
            mock_create.return_value = mock_service

            result = generate_image("a cat", "stability", {}, api_keys)

            assert result.provider == "openai"

            mock_create.assert_called()
            args, kwargs = mock_create.call_args
            assert args[0] == "openai"


class TestAudioFallbackChain:
    """Test audio provider fallback via generate_audio."""

    @pytest.mark.skip(reason="aiortc/av has Windows DLL dependency issues - test skipped")
    def test_audio_stub_fallback(self) -> None:
        """ElevenLabs preferred but no key; Google has key -> Google stub."""
        api_keys = {"google": "goog-test"}
        result = generate_audio("hello", "elevenlabs", {}, api_keys)
        assert result.provider == "google"
        assert result.metadata.get("status") == "stub_implementation"


class TestVideoFallbackChain:
    """Test video provider resolution."""

    def test_video_no_keys_raises(self) -> None:
        """Video resolve raises when no video provider has a key."""
        with pytest.raises(ProviderNotAvailableError):
            provider_registry.resolve(Modality.VIDEO, {})

    def test_video_resolve_with_key(self) -> None:
        """Video resolve returns the first provider with a key."""
        selected = provider_registry.resolve(
            Modality.VIDEO, {"runway": "r-key"}
        )
        assert selected == "runway"


class TestCrossModalityErrors:
    """Verify that asking a provider for the wrong modality raises."""

    def test_llm_provider_for_image_raises(self) -> None:
        with pytest.raises(ProviderNotSupportedError, match="does not support"):
            provider_registry.resolve(
                Modality.IMAGE,
                {"groq": "g-test"},
                preferred="groq",
            )

    def test_image_provider_for_audio_raises(self) -> None:
        with pytest.raises(ProviderNotSupportedError, match="does not support"):
            provider_registry.resolve(
                Modality.AUDIO,
                {"stability": "s-test"},
                preferred="stability",
            )
