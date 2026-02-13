from unittest.mock import MagicMock, patch

from services.audio_provider import generate_audio
from services.image_provider import generate_image
from services.llm_provider import generate_text

from app.schemas import AudioOptions, ImageOptions, TextOptions


class TestLLMProviders:
    @patch("services.llm_provider.requests.post")
    def test_call_openai(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "OpenAI Response"}}]
        }

        api_keys = {"openai_api_key": "sk-test"}
        options = TextOptions(model="gpt-4", temperature=0.5)

        result = generate_text("Hello", "openai", options, api_keys)

        assert result.content == "OpenAI Response"
        assert result.provider == "openai"
        assert result.model == "gpt-4"

        # Verify request
        args, kwargs = mock_post.call_args
        assert args[0] == "https://api.openai.com/v1/chat/completions"
        assert kwargs["json"]["model"] == "gpt-4"
        assert kwargs["json"]["temperature"] == 0.5
        assert kwargs["headers"]["Authorization"] == "Bearer sk-test"

    @patch("services.llm_provider.requests.post")
    def test_call_deepseek(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "DeepSeek Response"}}]
        }

        api_keys = {"deepseek_api_key": "ds-test"}
        result = generate_text("Hello", "deepseek", {}, api_keys)

        assert result.content == "DeepSeek Response"
        assert result.provider == "deepseek"
        assert result.model == "deepseek-chat"

    @patch("services.llm_provider.requests.post")
    def test_call_groq(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "Groq Response"}}]
        }

        api_keys = {"groq_api_key": "g-test"}
        result = generate_text("Hello", "groq", {}, api_keys)

        assert result.content == "Groq Response"
        assert result.provider == "groq"
        assert result.model is not None
        assert "llama" in result.model

    def test_call_google_stub(self) -> None:
        api_keys = {"google_api_key": "goog-test"}
        result = generate_text("Hello", "google", {}, api_keys)
        assert "google" in result.provider
        assert result.content is not None
        assert "stub" in result.content.lower()


class TestImageProviders:
    @patch("services.image_provider.requests.post")
    def test_call_stability(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"image": "base64_data"}

        api_keys = {"stability_api_key": "st-test"}
        options = ImageOptions(aspect_ratio="16:9", quality="hd")

        result = generate_image("Fantasy landscape", "stability", options, api_keys)

        assert result.image == "base64_data"
        assert result.provider == "stability"
        assert result.model == "sd3"

        # Verify request
        _, kwargs = mock_post.call_args
        assert kwargs["data"]["aspect_ratio"] == "16:9"
        assert kwargs["data"]["model"] == "sd3"
        assert kwargs["headers"]["Authorization"] == "Bearer st-test"

    @patch("services.image_provider.requests.post")
    def test_call_flux(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"output": "flux_url"}

        api_keys = {"flux_api_key": "f-test"}
        result = generate_image("Techno cat", "flux", {}, api_keys)

        assert result.image == "flux_url"
        assert result.provider == "flux"

    @patch("services.image_provider.requests.post")
    def test_call_openai_image(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "data": [
                {
                    "b64_json": "base64_dalle_image",
                    "revised_prompt": "Enhanced prompt by DALL-E"
                }
            ]
        }

        api_keys = {"openai_api_key": "sk-test"}
        options = ImageOptions(aspect_ratio="16:9", quality="hd")

        result = generate_image("Futuristic city", "openai", options, api_keys)

        assert result.image == "base64_dalle_image"
        assert result.provider == "openai"
        assert result.model == "dall-e-3"
        assert result.raw is not None
        assert result.raw["revised_prompt"] == "Enhanced prompt by DALL-E"

        # Verify request
        args, kwargs = mock_post.call_args
        assert args[0] == "https://api.openai.com/v1/images/generations"
        assert kwargs["json"]["model"] == "dall-e-3"
        assert kwargs["json"]["size"] == "1792x1024"  # 16:9 aspect ratio
        assert kwargs["json"]["quality"] == "hd"
        assert kwargs["json"]["response_format"] == "b64_json"
        assert kwargs["headers"]["Authorization"] == "Bearer sk-test"

    def test_call_google_image(self) -> None:
        """Test Google Imagen with mocked google-genai library."""
        import base64
        from unittest.mock import MagicMock, patch

        # Mock the google-genai library
        mock_genai = MagicMock()
        mock_types = MagicMock()

        # Create mock response
        mock_image = MagicMock()
        mock_image.image.image_bytes = base64.b64decode("dGVzdF9pbWFnZV9kYXRh")  # "test_image_data" in base64

        mock_response = MagicMock()
        mock_response.generated_images = [mock_image]

        mock_client = MagicMock()
        mock_client.models.generate_images.return_value = mock_response
        mock_genai.Client.return_value = mock_client

        mock_modules = {
            "google": MagicMock(genai=mock_genai),
            "google.genai": mock_genai,
            "google.genai.types": mock_types,
        }
        with patch.dict("sys.modules", mock_modules):
            api_keys = {"google_api_key": "goog-test"}
            options = ImageOptions(aspect_ratio="9:16", quality="hd")

            result = generate_image("Robot portrait", "google", options, api_keys)

            assert result.provider == "google"
            assert result.model == "imagen-3.0-generate-001"
            assert result.image is not None  # Should be base64 encoded
            assert result.raw is not None
            assert result.raw["aspect_ratio"] == "9:16"
            assert result.raw["image_size"] == "2K"  # hd quality maps to 2K

            # Verify client was called correctly
            mock_genai.Client.assert_called_once_with(api_key="goog-test")
            mock_client.models.generate_images.assert_called_once()


class TestAudioProviders:
    @patch("services.audio_provider.requests.post")
    def test_call_elevenlabs(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.content = b"audio_bytes"

        api_keys = {"elevenlabs_api_key": "el-test"}
        options = AudioOptions(voice="Adam")

        result = generate_audio("Hello world", "elevenlabs", options, api_keys)

        assert result.provider == "elevenlabs"
        assert result.audio is not None  # Should be base64 encoded

        # Verify request
        args, kwargs = mock_post.call_args
        assert "Adam" in args[0]
        assert kwargs["json"]["text"] == "Hello world"
        assert kwargs["headers"]["xi-api-key"] == "el-test"

    @patch("services.audio_provider.requests.post")
    def test_call_playht(self, mock_post: MagicMock) -> None:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"url": "playht_url"}

        api_keys = {"playht_api_key": "p-test"}
        result = generate_audio(
            "Voice test", "playht", {"voice": "standard_voice"}, api_keys
        )

        assert result.audio == "playht_url"
        assert result.provider == "playht"
