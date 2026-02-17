"""
Unified provider abstraction layer.

This package centralises provider metadata, adapter contracts, and
resolution logic so that every modality (LLM, image, audio, video) can
be switched via configuration alone.
"""

from .adapters import (  # noqa: F401
    AudioAdapter,
    BaseProviderAdapter,
    ImageAdapter,
    LLMAdapter,
    VideoAdapter,
)
from .capabilities import Modality, ProviderCapabilities  # noqa: F401
from .errors import (  # noqa: F401
    ProviderError,
    ProviderNotAvailableError,
    ProviderNotSupportedError,
    ProviderTimeoutError,
)
from .registry import ProviderRegistry, provider_registry  # noqa: F401
