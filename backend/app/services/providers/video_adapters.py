"""
Video-generation adapter implementations (scaffold).

These are placeholder adapters for future video providers.  Each one
returns a clear "not yet implemented" message so the endpoint can be
wired up immediately and providers can be added incrementally.
"""

from __future__ import annotations

import logging
from typing import Any

from app.schemas import AgentResult

from .adapters import BaseProviderAdapter
from .capabilities import Modality
from .errors import ProviderNotSupportedError

LOGGER = logging.getLogger(__name__)


class RunwayVideoAdapter(BaseProviderAdapter):
    """
    RunwayML video generation adapter (stub).

    Replace ``_do_invoke`` with a real Runway Gen-2/Gen-3 API call
    when ready.

    Example:
        >>> adapter = RunwayVideoAdapter()
        >>> adapter.provider_name
        'runway'
    """

    def __init__(self) -> None:
        super().__init__(Modality.VIDEO, "runway")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Raise :class:`ProviderNotSupportedError` (not yet implemented).

        Args:
            prompt: Video description (unused).
            options: Video options (unused).
            api_key: Runway API key (unused).
            system_prompt: Optional system message (unused).

        Raises:
            ProviderNotSupportedError: Always.
        """
        raise ProviderNotSupportedError(
            "RunwayML video generation is not yet implemented.",
            provider="runway",
            modality="video",
        )


class PikaVideoAdapter(BaseProviderAdapter):
    """
    Pika Labs video generation adapter (stub).

    Replace ``_do_invoke`` with a real Pika API call when ready.

    Example:
        >>> adapter = PikaVideoAdapter()
        >>> adapter.provider_name
        'pika'
    """

    def __init__(self) -> None:
        super().__init__(Modality.VIDEO, "pika")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Raise :class:`ProviderNotSupportedError` (not yet implemented).

        Args:
            prompt: Video description (unused).
            options: Video options (unused).
            api_key: Pika API key (unused).
            system_prompt: Optional system message (unused).

        Raises:
            ProviderNotSupportedError: Always.
        """
        raise ProviderNotSupportedError(
            "Pika Labs video generation is not yet implemented.",
            provider="pika",
            modality="video",
        )


class LumaVideoAdapter(BaseProviderAdapter):
    """
    Luma Labs (Dream Machine) video generation adapter (stub).

    Replace ``_do_invoke`` with a real Luma API call when ready.

    Example:
        >>> adapter = LumaVideoAdapter()
        >>> adapter.provider_name
        'luma'
    """

    def __init__(self) -> None:
        super().__init__(Modality.VIDEO, "luma")

    def _do_invoke(
        self,
        prompt: str,
        options: dict[str, Any],
        api_key: str,
        system_prompt: str | None = None,
    ) -> AgentResult:
        """
        Raise :class:`ProviderNotSupportedError` (not yet implemented).

        Args:
            prompt: Video description (unused).
            options: Video options (unused).
            api_key: Luma API key (unused).
            system_prompt: Optional system message (unused).

        Raises:
            ProviderNotSupportedError: Always.
        """
        raise ProviderNotSupportedError(
            "Luma Labs video generation is not yet implemented.",
            provider="luma",
            modality="video",
        )


# ======================================================================
# Adapter lookup table
# ======================================================================

VIDEO_ADAPTERS: dict[str, BaseProviderAdapter] = {
    "runway": RunwayVideoAdapter(),
    "pika": PikaVideoAdapter(),
    "luma": LumaVideoAdapter(),
}
