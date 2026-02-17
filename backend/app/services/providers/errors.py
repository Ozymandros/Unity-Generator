"""
Standardised provider error hierarchy.

All provider-related exceptions inherit from :class:`ProviderError` so
callers can catch a single base type and still differentiate where needed.
"""

from __future__ import annotations


class ProviderError(RuntimeError):
    """
    Base exception for any provider-related failure.

    Attributes:
        provider: Name of the provider that caused the error, if known.
        modality: The modality being requested, if applicable.

    Example:
        >>> try:
        ...     raise ProviderError("Something broke", provider="openai")
        ... except ProviderError as exc:
        ...     exc.provider
        'openai'
    """

    def __init__(
        self,
        message: str,
        *,
        provider: str | None = None,
        modality: str | None = None,
    ) -> None:
        super().__init__(message)
        self.provider = provider
        self.modality = modality


class ProviderNotSupportedError(ProviderError):
    """
    Raised when the requested provider is not registered.

    Example:
        >>> raise ProviderNotSupportedError(
        ...     "unknown_provider is not registered",
        ...     provider="unknown_provider",
        ... )  # doctest: +SKIP
    """


class ProviderNotAvailableError(ProviderError):
    """
    Raised when no valid API key is found for any provider of the
    requested modality.

    Example:
        >>> raise ProviderNotAvailableError(
        ...     "No API key for llm providers",
        ...     modality="llm",
        ... )  # doctest: +SKIP
    """


class ProviderTimeoutError(ProviderError):
    """
    Raised when a provider call exceeds its timeout.

    Example:
        >>> raise ProviderTimeoutError(
        ...     "Request to openai timed out after 60s",
        ...     provider="openai",
        ... )  # doctest: +SKIP
    """
