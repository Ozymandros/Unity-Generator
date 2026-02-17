"""
Tests for the ProviderOrchestratorPlugin.

Verifies provider selection delegation to the registry and
response normalisation logic.
"""

from unittest.mock import patch

import pytest
from agents.plugins.native.provider_orchestrator_plugin import (
    _MODALITY_ALIAS,
    ProviderOrchestratorPlugin,
)
from services.providers import Modality, ProviderError


class TestGetBestProvider:
    """Tests for ProviderOrchestratorPlugin.get_best_provider."""

    def test_empty_provider_type_raises(self) -> None:
        """An empty provider_type raises ValueError."""
        plugin = ProviderOrchestratorPlugin()
        with pytest.raises(ValueError, match="cannot be empty"):
            plugin.get_best_provider("")

    def test_invalid_provider_type_raises(self) -> None:
        """An unrecognised provider_type raises ValueError."""
        plugin = ProviderOrchestratorPlugin()
        with pytest.raises(ValueError, match="Invalid provider_type"):
            plugin.get_best_provider("telepathy")

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_selects_provider_with_key(self, mock_keys) -> None:
        """Returns a provider whose API key is available."""
        mock_keys.return_value = {"openai_api_key": "sk-test"}
        plugin = ProviderOrchestratorPlugin()
        result = plugin.get_best_provider("llm")
        assert result == "openai"

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_respects_preferred(self, mock_keys) -> None:
        """Preferred provider is used when its key exists."""
        mock_keys.return_value = {
            "openai_api_key": "sk-test",
            "groq_api_key": "g-test",
        }
        plugin = ProviderOrchestratorPlugin()
        result = plugin.get_best_provider("llm", preferred_provider="groq")
        assert result == "groq"

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_no_keys_raises_provider_error(self, mock_keys) -> None:
        """Raises ProviderError when no keys are available."""
        mock_keys.return_value = {}
        plugin = ProviderOrchestratorPlugin()
        with pytest.raises(ProviderError):
            plugin.get_best_provider("llm")

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_image_modality(self, mock_keys) -> None:
        """Image modality resolves correctly."""
        mock_keys.return_value = {"stability_api_key": "st-test"}
        plugin = ProviderOrchestratorPlugin()
        result = plugin.get_best_provider("image")
        assert result == "stability"

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_audio_modality(self, mock_keys) -> None:
        """Audio modality resolves correctly."""
        mock_keys.return_value = {"elevenlabs_api_key": "el-test"}
        plugin = ProviderOrchestratorPlugin()
        result = plugin.get_best_provider("audio")
        assert result == "elevenlabs"

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_video_modality(self, mock_keys) -> None:
        """Video modality resolves correctly."""
        mock_keys.return_value = {"runway_api_key": "r-test"}
        plugin = ProviderOrchestratorPlugin()
        result = plugin.get_best_provider("video")
        assert result == "runway"

    @patch("agents.plugins.native.provider_orchestrator_plugin.load_api_keys")
    def test_case_insensitive_type(self, mock_keys) -> None:
        """Provider type matching is case-insensitive."""
        mock_keys.return_value = {"openai_api_key": "sk-test"}
        plugin = ProviderOrchestratorPlugin()
        assert plugin.get_best_provider("LLM") == "openai"
        assert plugin.get_best_provider("Llm") == "openai"


class TestModalityAlias:
    """Tests for the _MODALITY_ALIAS mapping."""

    def test_all_modalities_covered(self) -> None:
        """Every Modality enum value has an alias entry."""
        for modality in Modality:
            assert modality.value in _MODALITY_ALIAS

    def test_alias_values(self) -> None:
        assert _MODALITY_ALIAS["llm"] == Modality.LLM
        assert _MODALITY_ALIAS["image"] == Modality.IMAGE
        assert _MODALITY_ALIAS["audio"] == Modality.AUDIO
        assert _MODALITY_ALIAS["video"] == Modality.VIDEO


class TestValidateResponse:
    """Tests for ProviderOrchestratorPlugin.validate_response."""

    def test_empty_provider_raises(self) -> None:
        plugin = ProviderOrchestratorPlugin()
        with pytest.raises(ValueError, match="provider cannot be empty"):
            plugin.validate_response("", {"content": "ok"}, "llm")

    def test_empty_response_raises(self) -> None:
        plugin = ProviderOrchestratorPlugin()
        with pytest.raises(ValueError, match="raw_response cannot be empty"):
            plugin.validate_response("openai", {}, "llm")

    def test_llm_normalization(self) -> None:
        plugin = ProviderOrchestratorPlugin()
        result = plugin.validate_response(
            "openai", {"content": "Hello", "model": "gpt-4"}, "llm"
        )
        assert result["provider"] == "openai"
        assert result["content"] == "Hello"
        assert result["model"] == "gpt-4"

    def test_image_normalization(self) -> None:
        plugin = ProviderOrchestratorPlugin()
        result = plugin.validate_response(
            "stability", {"url": "http://example.com/img.png", "base64": "b64"}, "image"
        )
        assert result["provider"] == "stability"
        assert result["url"] == "http://example.com/img.png"

    def test_audio_normalization(self) -> None:
        plugin = ProviderOrchestratorPlugin()
        result = plugin.validate_response(
            "elevenlabs", {"url": "http://example.com/audio.mp3"}, "audio"
        )
        assert result["provider"] == "elevenlabs"
        assert result["url"] == "http://example.com/audio.mp3"

    def test_unknown_type_passes_through(self) -> None:
        """Unknown provider type passes raw_response through."""
        plugin = ProviderOrchestratorPlugin()
        result = plugin.validate_response(
            "custom", {"custom_field": "value"}, "video"
        )
        assert result["provider"] == "custom"
        assert result["custom_field"] == "value"
