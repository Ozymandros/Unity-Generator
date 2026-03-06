"""
MemoryPrefsPlugin - Native Plugin for user preference management.

This plugin allows agents to query and update user preferences stored in SQLite,
personalizing the experience without requiring the user to specify them each time.
"""

import logging

try:
    from semantic_kernel.functions import kernel_function
except ImportError:
    def kernel_function(func=None, name=None, description=None):
        if func is not None and callable(func):
            return func
        def decorator(f):
            return f
        return decorator


from ....core.db import get_pref, init_db, set_pref

LOGGER = logging.getLogger(__name__)

# Initialize the database on import
init_db()


class MemoryPrefsPlugin:
    """
    Native plugin for managing user preferences.

    Allows agents to query and update preferences stored in SQLite,
    such as preferred providers, Unity configurations, etc.
    """

    # Common preference keys
    PREF_LLM_PROVIDER = "preferred_llm_provider"
    PREF_IMAGE_PROVIDER = "preferred_image_provider"
    PREF_AUDIO_PROVIDER = "preferred_audio_provider"
    PREF_UNITY_VERSION = "preferred_unity_version"
    PREF_DEFAULT_MODEL = "default_model"

    @kernel_function(
        name="get_user_preference",
        description="Queries a user preference from the SQLite database",
    )
    def get_user_preference(self, key: str) -> str | None:
        """
        Get a user preference from the database.

        Args:
            key: Key of the preference to query.

        Returns:
            Preference value or None if it doesn't exist.

        Example:
            >>> plugin = MemoryPrefsPlugin()
            >>> provider = plugin.get_user_preference("preferred_llm_provider")
            >>> provider is None or isinstance(provider, str)
            True
        """
        if not key or not key.strip():
            raise ValueError("key cannot be empty")

        value = get_pref(key.strip())
        if value:
            LOGGER.debug(f"Retrieved preference '{key}': {value}")
        else:
            LOGGER.debug(f"Preference '{key}' not found")

        return value

    @kernel_function(
        name="set_user_preference",
        description="Updates a user preference in the SQLite database",
    )
    def set_user_preference(self, key: str, value: str) -> str:
        """
        Set or update a user preference.

        Args:
            key: Preference key.
            value: Value to store.

        Returns:
            Confirmation message.

        Raises:
            ValueError: If key or value are empty.

        Example:
            >>> plugin = MemoryPrefsPlugin()
            >>> result = plugin.set_user_preference("preferred_llm_provider", "openai")
            >>> "saved" in result.lower() or "updated" in result.lower()
            True
        """
        if not key or not key.strip():
            raise ValueError("key cannot be empty")

        if value is None:
            raise ValueError("value cannot be None")

        set_pref(key.strip(), str(value))
        LOGGER.info(f"Saved preference '{key}': {value}")
        return f"Preference '{key}' saved successfully"

    @kernel_function(
        name="get_preferred_provider",
        description="Gets the preferred provider for a specific type (llm, image, audio)",
    )
    def get_preferred_provider(self, provider_type: str) -> str | None:
        """
        Get the preferred provider for a specific type.

        Args:
            provider_type: Provider type ("llm", "image", or "audio").

        Returns:
            Name of the preferred provider or None if not configured.

        Example:
            >>> plugin = MemoryPrefsPlugin()
            >>> plugin.set_user_preference("preferred_llm_provider", "openai")
            >>> provider = plugin.get_preferred_provider("llm")
            >>> provider == "openai"
            True
        """
        if not provider_type:
            raise ValueError("provider_type cannot be empty")

        provider_type = provider_type.lower()

        key_map = {
            "llm": self.PREF_LLM_PROVIDER,
            "image": self.PREF_IMAGE_PROVIDER,
            "audio": self.PREF_AUDIO_PROVIDER,
        }

        key = key_map.get(provider_type)
        if not key:
            raise ValueError(
                f"Invalid provider_type: {provider_type}. Must be 'llm', 'image', or 'audio'"
            )

        return self.get_user_preference(key)

    @kernel_function(
        name="get_unity_version",
        description="Gets the Unity version preferred by the user",
    )
    def get_unity_version(self) -> str:
        """
        Get the preferred Unity version, with fallback to "2022.3".

        Returns:
            Preferred Unity version or "2022.3" by default.

        Example:
            >>> plugin = MemoryPrefsPlugin()
            >>> version = plugin.get_unity_version()
            >>> "202" in version  # Valid Unity version
            True
        """
        version = self.get_user_preference(self.PREF_UNITY_VERSION)
        return version or "2022.3"

