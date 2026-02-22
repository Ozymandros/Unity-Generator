"""
Tests for the central provider registry.

Covers registration, capability queries, priority lists, key maps,
the ``resolve`` method that replaces ``select_provider``, the
``all_providers`` iterator, re-registration behaviour, and the
module-level default singleton.
"""

import pytest

from app.services.providers import (
    Modality,
    ProviderCapabilities,
    ProviderNotAvailableError,
    ProviderNotSupportedError,
    ProviderRegistry,
    provider_registry,
)

# ======================================================================
# ProviderRegistry unit tests (isolated instance)
# ======================================================================


class TestProviderRegistryRegistration:
    """Tests for provider registration."""

    def test_register_and_get(self) -> None:
        """Registering a provider makes it retrievable by name."""
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(
                name="demo",
                api_key_name="demo_key",
                modalities={Modality.LLM},
            )
        )
        caps = reg.get("demo")
        assert caps.name == "demo"
        assert caps.api_key_name == "demo_key"

    def test_register_empty_name_raises(self) -> None:
        """Registering with an empty name should raise ValueError."""
        reg = ProviderRegistry()
        with pytest.raises(ValueError, match="empty"):
            reg.register(ProviderCapabilities(name="", api_key_name="k"))

    def test_register_case_insensitive(self) -> None:
        """Provider names should be normalised to lowercase."""
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(
                name="MyProvider",
                api_key_name="my_key",
                modalities={Modality.LLM},
            )
        )
        assert reg.get("myprovider").name == "MyProvider"
        assert reg.get("MYPROVIDER").name == "MyProvider"

    def test_register_with_explicit_priority(self) -> None:
        """Explicit priority index places the provider at the right position."""
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(name="first", api_key_name="k1", modalities={Modality.LLM})
        )
        reg.register(
            ProviderCapabilities(name="second", api_key_name="k2", modalities={Modality.LLM}),
            priorities={Modality.LLM: 0},
        )
        assert reg.priority_list(Modality.LLM) == ["second", "first"]

    def test_re_register_replaces_capabilities(self) -> None:
        """Re-registering a provider updates its capabilities."""
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(
                name="demo", api_key_name="old_key", modalities={Modality.LLM},
            )
        )
        reg.register(
            ProviderCapabilities(
                name="demo", api_key_name="new_key", modalities={Modality.LLM, Modality.IMAGE},
            )
        )
        caps = reg.get("demo")
        assert caps.api_key_name == "new_key"
        assert Modality.IMAGE in caps.modalities

    def test_re_register_does_not_duplicate_in_priority(self) -> None:
        """Re-registering should not create duplicate entries in priority list."""
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(name="demo", api_key_name="k", modalities={Modality.LLM})
        )
        reg.register(
            ProviderCapabilities(name="demo", api_key_name="k", modalities={Modality.LLM})
        )
        assert reg.priority_list(Modality.LLM).count("demo") == 1


class TestProviderRegistryQueries:
    """Tests for query methods: supports, priority_list, key_map, all_providers."""

    def _make_registry(self) -> ProviderRegistry:
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(
                name="alpha",
                api_key_name="alpha_key",
                modalities={Modality.LLM, Modality.IMAGE},
            )
        )
        reg.register(
            ProviderCapabilities(
                name="beta",
                api_key_name="beta_key",
                modalities={Modality.IMAGE},
            )
        )
        return reg

    def test_supports_returns_true(self) -> None:
        reg = self._make_registry()
        assert reg.supports("alpha", Modality.LLM) is True
        assert reg.supports("alpha", Modality.IMAGE) is True

    def test_supports_returns_false_for_missing_modality(self) -> None:
        reg = self._make_registry()
        assert reg.supports("beta", Modality.LLM) is False

    def test_supports_returns_false_for_unknown_provider(self) -> None:
        reg = self._make_registry()
        assert reg.supports("unknown", Modality.LLM) is False

    def test_priority_list(self) -> None:
        reg = self._make_registry()
        assert reg.priority_list(Modality.IMAGE) == ["alpha", "beta"]
        assert reg.priority_list(Modality.AUDIO) == []

    def test_key_map(self) -> None:
        reg = self._make_registry()
        assert reg.key_map(Modality.IMAGE) == {
            "alpha": "alpha_key",
            "beta": "beta_key",
        }

    def test_get_unknown_raises(self) -> None:
        reg = self._make_registry()
        with pytest.raises(ProviderNotSupportedError, match="not registered"):
            reg.get("unknown")

    def test_all_providers_returns_all(self) -> None:
        """all_providers yields every registered provider."""
        reg = self._make_registry()
        names = {p.name for p in reg.all_providers()}
        assert names == {"alpha", "beta"}

    def test_all_providers_empty_registry(self) -> None:
        """all_providers on an empty registry yields nothing."""
        reg = ProviderRegistry()
        assert list(reg.all_providers()) == []


class TestProviderRegistryResolve:
    """Tests for the resolve method (replaces select_provider)."""

    def _make_registry(self) -> ProviderRegistry:
        reg = ProviderRegistry()
        reg.register(
            ProviderCapabilities(
                name="first",
                api_key_name="first_key",
                modalities={Modality.LLM},
            )
        )
        reg.register(
            ProviderCapabilities(
                name="second",
                api_key_name="second_key",
                modalities={Modality.LLM},
            )
        )
        return reg

    def test_resolve_preferred_with_key(self) -> None:
        reg = self._make_registry()
        selected = reg.resolve(Modality.LLM, {"first_key": "k"}, preferred="first")
        assert selected == "first"

    def test_resolve_preferred_without_key_falls_back(self) -> None:
        reg = self._make_registry()
        selected = reg.resolve(Modality.LLM, {"second_key": "k"}, preferred="first")
        assert selected == "second"

    def test_resolve_no_preferred_uses_priority(self) -> None:
        reg = self._make_registry()
        selected = reg.resolve(Modality.LLM, {"first_key": "k"})
        assert selected == "first"

    def test_resolve_no_keys_raises(self) -> None:
        reg = self._make_registry()
        with pytest.raises(ProviderNotAvailableError, match="No valid API key"):
            reg.resolve(Modality.LLM, {})

    def test_resolve_unknown_preferred_raises(self) -> None:
        reg = self._make_registry()
        with pytest.raises(ProviderNotSupportedError, match="not registered"):
            reg.resolve(Modality.LLM, {"first_key": "k"}, preferred="unknown")

    def test_resolve_preferred_wrong_modality_raises(self) -> None:
        reg = self._make_registry()
        with pytest.raises(ProviderNotSupportedError, match="does not support modality"):
            reg.resolve(Modality.IMAGE, {"first_key": "k"}, preferred="first")

    def test_resolve_skips_empty_string_key(self) -> None:
        """An empty-string key should not count as valid."""
        reg = self._make_registry()
        selected = reg.resolve(Modality.LLM, {"first_key": "", "second_key": "k"})
        assert selected == "second"


# ======================================================================
# Capabilities model tests
# ======================================================================


class TestProviderCapabilities:
    """Tests for ProviderCapabilities Pydantic model."""

    def test_defaults(self) -> None:
        caps = ProviderCapabilities(name="x", api_key_name="k")
        assert caps.modalities == set()
        assert caps.default_models == {}
        assert caps.base_url is None
        assert caps.supports_function_calling is False
        assert caps.openai_compatible is False
        assert caps.extra == {}

    def test_set_modalities(self) -> None:
        caps = ProviderCapabilities(
            name="x", api_key_name="k", modalities={Modality.LLM, Modality.IMAGE}
        )
        assert Modality.LLM in caps.modalities
        assert Modality.IMAGE in caps.modalities


# ======================================================================
# Modality enum tests
# ======================================================================


class TestModality:
    """Tests for the Modality enum."""

    def test_values(self) -> None:
        assert Modality.LLM.value == "llm"
        assert Modality.IMAGE.value == "image"
        assert Modality.AUDIO.value == "audio"
        assert Modality.VIDEO.value == "video"

    def test_all_members(self) -> None:
        assert len(Modality) == 4


# ======================================================================
# Error hierarchy tests
# ======================================================================


class TestProviderErrors:
    """Tests for error classes preserving provider/modality attributes."""

    def test_provider_error_attributes(self) -> None:
        err = ProviderNotSupportedError("fail", provider="openai", modality="llm")
        assert err.provider == "openai"
        assert err.modality == "llm"
        assert str(err) == "fail"

    def test_provider_not_available_error_modality(self) -> None:
        err = ProviderNotAvailableError("no key", modality="image")
        assert err.modality == "image"
        assert err.provider is None


# ======================================================================
# Default registry (singleton) smoke tests
# ======================================================================


class TestDefaultRegistry:
    """Smoke tests for the module-level singleton ``provider_registry``."""

    def test_llm_providers_registered(self) -> None:
        llm_list = provider_registry.priority_list(Modality.LLM)
        assert "openai" in llm_list
        assert "deepseek" in llm_list
        assert "groq" in llm_list
        assert "google" in llm_list
        assert "anthropic" in llm_list
        assert "huggingface" in llm_list

    def test_image_providers_registered(self) -> None:
        img_list = provider_registry.priority_list(Modality.IMAGE)
        assert "stability" in img_list
        assert "openai" in img_list
        assert "flux" in img_list

    def test_audio_providers_registered(self) -> None:
        aud_list = provider_registry.priority_list(Modality.AUDIO)
        assert "elevenlabs" in aud_list
        assert "playht" in aud_list

    def test_video_providers_registered(self) -> None:
        vid_list = provider_registry.priority_list(Modality.VIDEO)
        assert "runway" in vid_list
        assert "pika" in vid_list
        assert "luma" in vid_list

    def test_llm_key_map_matches_legacy(self) -> None:
        """The registry-derived key map should be a superset of the old LLM_KEY_MAP."""
        km = provider_registry.key_map(Modality.LLM)
        assert km["openai"] == "openai_api_key"
        assert km["deepseek"] == "deepseek_api_key"
        assert km["groq"] == "groq_api_key"

    def test_image_key_map(self) -> None:
        km = provider_registry.key_map(Modality.IMAGE)
        assert km["stability"] == "stability_api_key"
        assert km["openai"] == "openai_api_key"

    def test_audio_key_map(self) -> None:
        km = provider_registry.key_map(Modality.AUDIO)
        assert km["elevenlabs"] == "elevenlabs_api_key"
        assert km["playht"] == "playht_api_key"

    def test_video_key_map(self) -> None:
        km = provider_registry.key_map(Modality.VIDEO)
        assert km["runway"] == "runway_api_key"
        assert km["pika"] == "pika_api_key"
        assert km["luma"] == "luma_api_key"

    def test_openai_capabilities(self) -> None:
        caps = provider_registry.get("openai")
        assert caps.openai_compatible is True
        assert caps.supports_function_calling is True
        assert Modality.LLM in caps.modalities
        assert Modality.IMAGE in caps.modalities

    def test_stability_not_openai_compatible(self) -> None:
        caps = provider_registry.get("stability")
        assert caps.openai_compatible is False

    def test_llm_priority_order(self) -> None:
        """LLM priority should follow: google > anthropic > deepseek > openrouter > openai > groq."""
        order = provider_registry.priority_list(Modality.LLM)
        assert order.index("google") < order.index("anthropic")
        assert order.index("anthropic") < order.index("deepseek")
        assert order.index("deepseek") < order.index("openrouter")
        assert order.index("openrouter") < order.index("openai")
        assert order.index("openai") < order.index("groq")

    def test_image_priority_order(self) -> None:
        """Image priority should include stability."""
        order = provider_registry.priority_list(Modality.IMAGE)
        assert "stability" in order

    def test_all_providers_count(self) -> None:
        """Default registry should have at least 13 providers."""
        providers = list(provider_registry.all_providers())
        assert len(providers) >= 13
