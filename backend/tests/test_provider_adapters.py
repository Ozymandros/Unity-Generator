"""
Tests for provider adapter implementations.

Verifies that each adapter correctly transforms inputs, calls the
provider API, and returns a normalised :class:`AgentResult`.
Covers all modalities, the ``get_opt`` helper, error wrapping, protocol
conformance, and every concrete adapter class.
"""


from unittest.mock import MagicMock, patch

import pytest

# Strict import order: stdlib, blank, third-party, blank, local
from app.schemas import AgentResult
from app.services.providers.adapters import (
    AudioAdapter,
    BaseProviderAdapter,
    ImageAdapter,
    LLMAdapter,
    VideoAdapter,
)
from app.services.providers.audio_adapters import (
    AUDIO_ADAPTERS,
    ElevenLabsAudioAdapter,
    GoogleAudioAdapter,
    OpenAIAudioAdapter,
    PlayHTAudioAdapter,
)
from app.services.providers.capabilities import Modality
from app.services.providers.errors import ProviderError, ProviderTimeoutError
from app.services.providers.image_adapters import (
    IMAGE_ADAPTERS,
    FluxImageAdapter,
    OpenAIImageAdapter,
    StabilityImageAdapter,
)
from app.services.providers.llm_adapters import (
    LLM_ADAPTERS,
    AnthropicLLMAdapter,
    DeepSeekLLMAdapter,
    GoogleLLMAdapter,
    GroqLLMAdapter,
    OpenAILLMAdapter,
    OpenRouterLLMAdapter,
)
from app.services.providers.video_adapters import VIDEO_ADAPTERS

# ======================================================================
# Protocol conformance
# ======================================================================


class TestProtocolConformance:
    """Verify every adapter satisfies its runtime-checkable protocol."""

    def test_llm_adapters_satisfy_protocol(self) -> None:
        for adapter in LLM_ADAPTERS.values():
            assert isinstance(adapter, LLMAdapter)

    def test_image_adapters_satisfy_protocol(self) -> None:
        for adapter in IMAGE_ADAPTERS.values():
            assert isinstance(adapter, ImageAdapter)

    def test_audio_adapters_satisfy_protocol(self) -> None:
        for adapter in AUDIO_ADAPTERS.values():
            assert isinstance(adapter, AudioAdapter)

    def test_video_adapters_satisfy_protocol(self) -> None:
        for adapter in VIDEO_ADAPTERS.values():
            assert isinstance(adapter, VideoAdapter)


# ======================================================================
# get_opt helper
# ======================================================================


class TestGetOptHelper:
    """Tests for BaseProviderAdapter.get_opt static method."""

    def test_get_opt_from_dict(self) -> None:
        assert BaseProviderAdapter.get_opt({"a": 1}, "a", 0) == 1

    def test_get_opt_default_from_dict(self) -> None:
        assert BaseProviderAdapter.get_opt({}, "missing", 42) == 42

    def test_get_opt_from_object(self) -> None:
        class Obj:
            temperature = 0.9
        # Correct usage: pass the object, not its __dict__
        assert BaseProviderAdapter.get_opt(Obj(), "temperature", 0.7) == 0.9

    def test_get_opt_default_from_object(self) -> None:
        class Obj:
            pass
        assert BaseProviderAdapter.get_opt(Obj().__dict__, "missing", "default") == "default"


# ======================================================================
# LLM adapter tests
# ======================================================================


class TestLLMAdapters:
    """Unit tests for LLM adapter classes."""

    def test_adapter_lookup_table_complete(self) -> None:
        """All expected LLM providers have an adapter instance."""
        expected = {"openai", "deepseek", "openrouter", "groq", "google", "anthropic"}
        assert set(LLM_ADAPTERS.keys()) == expected

    @patch("app.services.providers.llm_adapters.requests.post")
    def test_openai_adapter_invoke(self, mock_post: MagicMock) -> None:
        """OpenAI adapter sends correct payload and parses response."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "output": [{"content": "test response"}]
        }
        mock_post.return_value.raise_for_status = MagicMock()

        adapter = OpenAILLMAdapter()
        result = adapter.invoke(
            "hello",
            {"model": "gpt-4o-mini", "temperature": 0.5},
            "sk-test",
            system_prompt="be helpful",
        )

        assert isinstance(result, AgentResult)
        assert result.content == "test response"
        assert result.provider == "openai"
        assert result.model == "gpt-4o-mini"

        payload = mock_post.call_args.kwargs["json"]
        assert payload["input"][0]["role"] == "system"
        assert payload["input"][1]["role"] == "user"

    @patch("app.services.providers.llm_adapters.requests.post")
    def test_openai_adapter_without_system_prompt(self, mock_post: MagicMock) -> None:
        """OpenAI adapter omits system message when system_prompt is None."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "output": [{"content": "ok"}]
        }

        OpenAILLMAdapter().invoke("hello", {}, "sk-test")

        payload = mock_post.call_args.kwargs["json"]
        assert len(payload["input"]) == 1
        assert payload["input"][0]["role"] == "user"

    @patch("requests.post")
    def test_google_adapter_returns_content(self, mock_post: MagicMock) -> None:
        """Google adapter returns content from API."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": "Hello from Google"}]}}]
        }
        mock_post.return_value = mock_response

        adapter = GoogleLLMAdapter()
        result = adapter.invoke("test prompt", {}, "key")
        assert result.content == "Hello from Google"
        assert result.provider == "google"

    @patch("requests.post")
    def test_google_adapter_respects_model_option(self, mock_post: MagicMock) -> None:
        """Google adapter respects model option."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{"content": {"parts": [{"text": "OK"}]}}]
        }
        mock_post.return_value = mock_response

        result = GoogleLLMAdapter().invoke("hi", {"model": "gemini-pro"}, "k")
        assert result.model == "gemini-pro"
        assert "gemini-pro" in mock_post.call_args.args[0]

    def test_anthropic_stub_returns_content(self) -> None:
        """Anthropic stub adapter returns content containing 'stub'."""
        adapter = AnthropicLLMAdapter()
        result = adapter.invoke("test prompt", {}, "key")
        assert result.content is not None
        assert "stub" in result.content.lower()
        assert result.provider == "anthropic"

    def test_anthropic_stub_respects_model_option(self) -> None:
        """Anthropic stub respects model option."""
        result = AnthropicLLMAdapter().invoke("hi", {"model": "claude-4"}, "k")
        assert result.model == "claude-4"

    def test_invoke_empty_prompt_raises(self) -> None:
        """BaseProviderAdapter.invoke rejects empty prompts."""
        adapter = OpenAILLMAdapter()
        with pytest.raises(ProviderError, match="Prompt cannot be empty"):
            adapter.invoke("", {}, "key")

    def test_invoke_empty_api_key_raises(self) -> None:
        """BaseProviderAdapter.invoke rejects empty API keys."""
        adapter = OpenAILLMAdapter()
        with pytest.raises(ProviderError, match="API key is required"):
            adapter.invoke("hello", {}, "")

    @patch("app.services.providers.llm_adapters.requests.post")
    def test_deepseek_adapter_endpoint(self, mock_post: MagicMock) -> None:
        """DeepSeek adapter hits the correct endpoint."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "ok"}}]
        }

        DeepSeekLLMAdapter().invoke("hi", {}, "ds-key")

        url = mock_post.call_args.args[0]
        assert "deepseek" in url

    @patch("app.services.providers.llm_adapters.requests.post")
    def test_openrouter_adapter_endpoint(self, mock_post: MagicMock) -> None:
        """OpenRouter adapter hits the correct endpoint."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "ok"}}]
        }

        OpenRouterLLMAdapter().invoke("hi", {}, "or-key")

        url = mock_post.call_args.args[0]
        assert "openrouter" in url

    @patch("app.services.providers.llm_adapters.requests.post")
    def test_groq_adapter_endpoint(self, mock_post: MagicMock) -> None:
        """Groq adapter hits the correct endpoint."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "choices": [{"message": {"content": "ok"}}]
        }

        GroqLLMAdapter().invoke("hi", {}, "g-key")

        url = mock_post.call_args.args[0]
        assert "groq" in url


# ======================================================================
# Image adapter tests
# ======================================================================


class TestImageAdapters:
    """Unit tests for image adapter classes."""

    def test_adapter_lookup_table_complete(self) -> None:
        expected = {"openai", "google", "stability", "flux"}
        assert set(IMAGE_ADAPTERS.keys()) == expected

    @patch("app.services.providers.image_adapters.requests.post")
    def test_stability_adapter_invoke(self, mock_post: MagicMock) -> None:
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {"image": "b64data"}

        adapter = StabilityImageAdapter()
        result = adapter.invoke(
            "sunset",
            {"quality": "hd", "aspect_ratio": "16:9", "output_format": "png"},
            "st-key",
        )

        assert result.provider == "stability"
        assert result.image == "b64data"
        assert result.model == "sd3"

    @patch("app.services.providers.image_adapters.requests.post")
    def test_openai_image_adapter_invoke(self, mock_post: MagicMock) -> None:
        """OpenAI DALL-E adapter sends correct payload."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {
            "data": [{"b64_json": "img_b64", "revised_prompt": "better prompt"}]
        }

        result = OpenAIImageAdapter().invoke("city", {"quality": "standard"}, "sk-test")

        assert result.provider == "openai"
        assert result.model == "dall-e-3"
        assert result.image == "img_b64"
        assert result.raw is not None
        assert result.raw["revised_prompt"] == "better prompt"

    @patch("app.services.providers.image_adapters.requests.post")
    def test_flux_adapter_invoke(self, mock_post: MagicMock) -> None:
        """Flux adapter sends correct payload to Replicate."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {"output": "flux_url"}

        result = FluxImageAdapter().invoke("cat", {"quality": "hd"}, "tok-test")

        assert result.provider == "flux"
        assert result.image == "flux_url"
        assert result.model == "flux-dev"  # hd maps to flux-dev

    @patch("app.services.providers.image_adapters.requests.post")
    def test_stability_standard_uses_turbo(self, mock_post: MagicMock) -> None:
        """Standard quality maps to sd3-turbo model."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {"image": "b64"}

        result = StabilityImageAdapter().invoke("test", {"quality": "standard"}, "key")
        assert result.model == "sd3-turbo"


# ======================================================================
# Audio adapter tests
# ======================================================================


class TestAudioAdapters:
    """Unit tests for audio adapter classes."""

    def test_adapter_lookup_table_complete(self) -> None:
        expected = {"elevenlabs", "openai", "google", "playht"}
        assert set(AUDIO_ADAPTERS.keys()) == expected

    @patch("app.services.providers.audio_adapters.requests.post")
    def test_elevenlabs_adapter_invoke(self, mock_post: MagicMock) -> None:
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.content = b"audiodata"

        adapter = ElevenLabsAudioAdapter()
        result = adapter.invoke(
            "hello world",
            {"voice": "Rachel", "model_id": "eleven_multilingual_v2",
             "stability": 0.5, "similarity_boost": 0.75, "format": "mp3"},
            "el-key",
        )

        assert result.provider == "elevenlabs"
        assert result.audio is not None

    @patch("app.services.providers.audio_adapters.requests.post")
    def test_playht_adapter_invoke(self, mock_post: MagicMock) -> None:
        """PlayHT adapter sends correct payload and returns audio URL."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.json.return_value = {"url": "https://cdn.playht.com/audio.mp3"}

        result = PlayHTAudioAdapter().invoke(
            "test", {"voice": "standard_voice", "format": "mp3"}, "ph-key"
        )

        assert result.provider == "playht"
        assert result.audio == "https://cdn.playht.com/audio.mp3"

    def test_openai_audio_stub(self) -> None:
        """OpenAI audio stub returns placeholder."""
        result = OpenAIAudioAdapter().invoke("hello", {}, "key")
        assert result.provider == "openai"
        assert result.audio == "openai_audio_stub"

    def test_google_audio_stub(self) -> None:
        """Google audio stub returns placeholder."""
        result = GoogleAudioAdapter().invoke("hello", {}, "key")
        assert result.provider == "google"
        assert result.audio == "google_audio_stub"

    @patch("app.services.providers.audio_adapters.requests.post")
    def test_elevenlabs_with_system_prompt(self, mock_post: MagicMock) -> None:
        """ElevenLabs adapter prepends system prompt to text."""
        mock_post.return_value.raise_for_status = MagicMock()
        mock_post.return_value.content = b"audio"

        ElevenLabsAudioAdapter().invoke(
            "world", {}, "key", system_prompt="Say hello"
        )

        payload = mock_post.call_args.kwargs["json"]
        assert "Say hello" in payload["text"]
        assert "world" in payload["text"]


# ======================================================================
# Video adapter tests (stubs)
# ======================================================================


class TestVideoAdapters:
    """Unit tests for video adapter stubs."""

    def test_adapter_lookup_table_complete(self) -> None:
        expected = {"runway", "pika", "luma"}
        assert set(VIDEO_ADAPTERS.keys()) == expected

    def test_runway_stub_raises_not_supported(self) -> None:
        from app.services.providers.errors import ProviderNotSupportedError

        with pytest.raises(ProviderNotSupportedError, match="not yet implemented"):
            VIDEO_ADAPTERS["runway"].invoke("a sunrise", {}, "key")

    def test_pika_stub_raises_not_supported(self) -> None:
        from app.services.providers.errors import ProviderNotSupportedError

        with pytest.raises(ProviderNotSupportedError, match="not yet implemented"):
            VIDEO_ADAPTERS["pika"].invoke("a sunset", {}, "key")

    def test_luma_stub_raises_not_supported(self) -> None:
        from app.services.providers.errors import ProviderNotSupportedError

        with pytest.raises(ProviderNotSupportedError, match="not yet implemented"):
            VIDEO_ADAPTERS["luma"].invoke("a wave", {}, "key")

    def test_video_adapter_modality(self) -> None:
        """All video adapters have modality VIDEO."""
        for adapter in VIDEO_ADAPTERS.values():
            assert adapter.modality == Modality.VIDEO


# ======================================================================
# BaseProviderAdapter error wrapping
# ======================================================================


class TestBaseProviderAdapterErrorHandling:
    """Tests for error translation in BaseProviderAdapter.invoke."""

    def test_timeout_is_wrapped(self) -> None:
        """TimeoutError inside _do_invoke becomes ProviderTimeoutError."""

        class BrokenAdapter(BaseProviderAdapter):
            def __init__(self) -> None:
                super().__init__(Modality.LLM, "broken")

            def _do_invoke(self, prompt, options, api_key, system_prompt=None):
                raise TimeoutError("took too long")

        with pytest.raises(ProviderTimeoutError, match="timed out"):
            BrokenAdapter().invoke("hi", {}, "key")

    def test_generic_exception_is_wrapped(self) -> None:
        """Unexpected exceptions become ProviderError."""

        class CrashAdapter(BaseProviderAdapter):
            def __init__(self) -> None:
                super().__init__(Modality.LLM, "crash")

            def _do_invoke(self, prompt, options, api_key, system_prompt=None):
                raise ValueError("oops")

        with pytest.raises(ProviderError, match="adapter error"):
            CrashAdapter().invoke("hi", {}, "key")

    def test_provider_error_passes_through(self) -> None:
        """ProviderError subclasses are re-raised without wrapping."""
        from app.services.providers.errors import ProviderNotSupportedError

        class DirectErrorAdapter(BaseProviderAdapter):
            def __init__(self) -> None:
                super().__init__(Modality.LLM, "direct")

            def _do_invoke(self, prompt, options, api_key, system_prompt=None):
                raise ProviderNotSupportedError("nope", provider="direct")

        with pytest.raises(ProviderNotSupportedError, match="nope"):
            DirectErrorAdapter().invoke("hi", {}, "key")

    def test_error_preserves_provider_and_modality(self) -> None:
        """Wrapped error retains provider and modality attributes."""

        class BadAdapter(BaseProviderAdapter):
            def __init__(self) -> None:
                super().__init__(Modality.IMAGE, "bad_prov")

            def _do_invoke(self, prompt, options, api_key, system_prompt=None):
                raise RuntimeError("boom")

        with pytest.raises(ProviderError) as exc_info:
            BadAdapter().invoke("hi", {}, "key")

        assert exc_info.value.provider == "bad_prov"
        assert exc_info.value.modality == "image"
