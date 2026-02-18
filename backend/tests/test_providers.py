"""
Unit tests for provider services using Semantic Kernel mocks.
"""

from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas import AudioOptions, ImageOptions, TextOptions
from app.services.audio_provider import generate_audio
from app.services.image_provider import generate_image
from app.services.llm_provider import generate_text


class TestLLMProviders:
    @patch("app.services.providers.registry.provider_registry.create_chat_service")
    def test_generate_text_openai(self, mock_create: MagicMock) -> None:
        # Mock SK Service
        mock_service = AsyncMock()
        mock_service.get_chat_message_content.return_value = "Mocked Response"
        mock_create.return_value = mock_service

        api_keys = {"openai_api_key": "sk-test"}
        options = TextOptions(model="gpt-4", temperature=0.5)

        result = generate_text("Hello", "openai", options, api_keys)

        assert result.content == "Mocked Response"
        assert result.provider == "openai"
        # The model in result comes from settings, which we set in generate_text
        assert result.model == "gpt-4"

        # Verify service creation
        mock_create.assert_called_with("openai", "sk-test")

        # Verify SK invocation
        mock_service.get_chat_message_content.assert_called_once()
        _, kwargs = mock_service.get_chat_message_content.call_args
        assert kwargs["settings"].ai_model_id == "gpt-4"
        assert kwargs["settings"].temperature == 0.5


class TestImageProviders:
    @patch("app.services.providers.registry.provider_registry.create_text_to_image_service")
    def test_generate_image_openai(self, mock_create: MagicMock) -> None:
        mock_service = AsyncMock()
        mock_service.generate_image.return_value = "https://mock.url/image.png"
        mock_create.return_value = mock_service

        api_keys = {"openai_api_key": "sk-test"}
        options = ImageOptions(aspect_ratio="1024x1024", quality="hd")

        result = generate_image("A futuristic city", "openai", options, api_keys)

        assert result.content == "https://mock.url/image.png"
        assert result.provider == "openai"

        # Verify SK invocation
        # generate_image(prompt, width, height)
        mock_service.generate_image.assert_called_once()


class TestAudioProviders:
    @patch("app.services.providers.registry.provider_registry.create_text_to_audio_service")
    def test_generate_audio_openai(self, mock_create: MagicMock) -> None:
        mock_service = AsyncMock()

        # Mock AudioContent
        mock_content = MagicMock()
        mock_content.data = b"audio_bytes"
        mock_content.uri = None
        mock_content.metadata = {"format": "mp3"}

        mock_service.get_audio_content.return_value = mock_content
        mock_create.return_value = mock_service

        api_keys = {"openai_api_key": "sk-test"}
        options = AudioOptions(voice="alloy")

        result = generate_audio("Hello world", "openai", options, api_keys)

        # base64 encoded "audio_bytes" -> "YXVkaW9fYnl0ZXM="
        assert result.content == "YXVkaW9fYnl0ZXM="
        assert result.provider == "openai"

        mock_service.get_audio_content.assert_called_once()
