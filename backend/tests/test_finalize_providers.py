"""
Tests for provider handling in the finalize workflow.

Verifies that ``provider_overrides`` in ``FinalizeProjectRequest`` are
respected and that the registry is used for fallback.
"""




from services.providers import Modality, provider_registry

from app.schemas import FinalizeProjectRequest, VideoOptions


class TestFinalizeProviderOverrides:
    """Test provider_overrides resolution in the finalize flow."""

    def test_provider_overrides_defaults_to_empty(self) -> None:
        """FinalizeProjectRequest.provider_overrides defaults to empty dict."""
        req = FinalizeProjectRequest()
        assert req.provider_overrides == {}

    def test_provider_overrides_accept_per_modality(self) -> None:
        """Overrides can specify a provider per modality."""
        req = FinalizeProjectRequest(
            provider_overrides={
                "code": "deepseek",
                "text": "openai",
                "image": "stability",
                "audio": "elevenlabs",
            }
        )
        assert req.provider_overrides["code"] == "deepseek"
        assert req.provider_overrides["image"] == "stability"

    def test_provider_overrides_allow_none_values(self) -> None:
        """None values in overrides mean 'use default preference'."""
        req = FinalizeProjectRequest(
            provider_overrides={"code": None, "text": "openai"}
        )
        assert req.provider_overrides["code"] is None
        assert req.provider_overrides["text"] == "openai"


class TestFinalizeRegistryIntegration:
    """Verify that the registry can resolve providers referenced by finalize."""

    def test_resolve_code_provider_from_override(self) -> None:
        selected = provider_registry.resolve(
            Modality.LLM,
            {"deepseek_api_key": "ds-test"},
            preferred="deepseek",
        )
        assert selected == "deepseek"

    def test_resolve_image_provider_from_override(self) -> None:
        selected = provider_registry.resolve(
            Modality.IMAGE,
            {"stability_api_key": "st-test"},
            preferred="stability",
        )
        assert selected == "stability"

    def test_resolve_audio_provider_from_override(self) -> None:
        selected = provider_registry.resolve(
            Modality.AUDIO,
            {"elevenlabs_api_key": "el-test"},
            preferred="elevenlabs",
        )
        assert selected == "elevenlabs"


class TestVideoOptionsSchema:
    """Verify VideoOptions defaults and validation."""

    def test_defaults(self) -> None:
        opts = VideoOptions()
        assert opts.duration == 5
        assert opts.aspect_ratio == "16:9"
        assert opts.resolution == "720p"
        assert opts.fps == 24
        assert opts.model is None

    def test_custom_values(self) -> None:
        opts = VideoOptions(duration=10, resolution="1080p", fps=30)
        assert opts.duration == 10
        assert opts.resolution == "1080p"
        assert opts.fps == 30
