import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.audio_provider import generate_audio
from app.schemas import AudioOptions

def test_generate_audio_voice_validation_fix():
    """
    Test that generate_audio handles invalid voices gracefully 
    without crashing due to OpenAI's strict validation.
    """
    # Mock api_keys
    api_keys = {"openai": "fake-key"}

    # Mock provider_registry
    with patch("app.services.audio_provider.provider_registry") as mock_registry:
        mock_registry.resolve.return_value = "openai"
        mock_registry.get.return_value.api_key_name = "openai"
        mock_registry.get.return_value.default_models = {"audio": "tts-1"}

        # Mock the service with AsyncMock for the actual call
        mock_service = MagicMock()
        mock_service.get_audio_content = AsyncMock(return_value=MagicMock(data=b"dummy", metadata={}))
        mock_registry.create_text_to_audio_service.return_value = mock_service

        # Mock instantiate_prompt_execution_settings to return an object with 'voice'
        class MockSettings:
            def __init__(self):
                self._voice = "alloy"
            @property
            def voice(self): return self._voice
            @voice.setter
            def voice(self, value):
                allowed = ["alloy", "ash", "ballad"]
                if value not in allowed:
                    raise ValueError(f"Invalid voice: {value}")
                self._voice = value

        mock_settings = MockSettings()
        mock_service.instantiate_prompt_execution_settings.return_value = mock_settings

        result = generate_audio(
            prompt="Hello",
            provider="openai",
            options=AudioOptions(voice="Rachel", model="tts-1"),
            api_keys=api_keys
        )

        assert result.provider == "openai"
        # Should have fallen back to alloy
        assert mock_settings.voice == "alloy"

def test_generate_audio_custom_voice_success():
    """
    Test that a custom voice (like Rachel for ElevenLabs) works.
    """
    api_keys = {"elevenlabs": "fake-key"}

    with patch("app.services.audio_provider.provider_registry") as mock_registry:
        mock_registry.resolve.return_value = "elevenlabs"
        mock_registry.get.return_value.api_key_name = "elevenlabs"
        mock_registry.get.return_value.default_models = {"audio": "eleven_multilingual_v2"}

        mock_service = MagicMock()
        mock_service.get_audio_content = AsyncMock(return_value=MagicMock(data=b"dummy", metadata={}))
        mock_registry.create_text_to_audio_service.return_value = mock_service

        class GenericSettings:
            def __init__(self):
                self.voice = "default"

        mock_settings = GenericSettings()
        mock_service.instantiate_prompt_execution_settings.return_value = mock_settings

        result = generate_audio(
            prompt="Hello",
            provider="elevenlabs",
            options=AudioOptions(voice="Rachel", model="eleven_multilingual_v2"),
            api_keys=api_keys
        )

        assert result.provider == "elevenlabs"
        assert mock_settings.voice == "Rachel"
