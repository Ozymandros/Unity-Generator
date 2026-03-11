"""
Database module for user preferences and application data.

This module provides database operations for the Unity Generator backend.
It uses SQLite for cross-platform compatibility and proper connection management.
"""

import logging
import sqlite3
from pathlib import Path

from app.core.config import get_db_dir

LOGGER = logging.getLogger(__name__)


def get_db_path() -> Path:
    """
    Get the path to the SQLite database file.

    Returns:
        Path to the user_prefs.db file in the database directory.
    """
    return get_db_dir() / "user_prefs.db"


def init_db() -> None:
    """
    Initialize the database with required tables.

    Creates the database directory if it doesn't exist and initializes
    all required tables for user preferences, providers, and models.
    On "database disk image is malformed", removes the DB file and retries once
    so the app can recover from corruption (e.g. after a bad migration or crash).
    """
    db_dir = get_db_dir()
    db_dir.mkdir(parents=True, exist_ok=True)
    db_path = get_db_path()

    for attempt in range(2):
        try:
            conn = sqlite3.connect(db_path)
            try:
                cursor = conn.cursor()

                # User preferences table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS user_prefs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        key TEXT UNIQUE NOT NULL,
                        value TEXT NOT NULL
                    )
                    """
                )

                # Providers table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS providers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL,
                        api_key_name TEXT,
                        base_url TEXT,
                        openai_compatible BOOLEAN DEFAULT 0,
                        requires_api_key BOOLEAN DEFAULT 1,
                        supports_vision BOOLEAN DEFAULT 0,
                        supports_streaming BOOLEAN DEFAULT 0,
                        supports_function_calling BOOLEAN DEFAULT 0,
                        supports_tool_use BOOLEAN DEFAULT 0,
                        modalities TEXT NOT NULL,
                        default_models TEXT NOT NULL,
                        extra TEXT
                    )
                    """
                )

                # Provider models table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS provider_models (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        provider TEXT NOT NULL,
                        model_value TEXT NOT NULL,
                        model_label TEXT NOT NULL,
                        modality TEXT DEFAULT 'llm',
                        UNIQUE(provider, model_value)
                    )
                    """
                )

                # Migration: Add modality column if it doesn't exist
                cursor.execute("PRAGMA table_info(provider_models)")
                columns = [column[1] for column in cursor.fetchall()]
                if "modality" not in columns:
                    cursor.execute("ALTER TABLE provider_models ADD COLUMN modality TEXT DEFAULT 'llm'")

                # API keys table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS api_keys (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        service_name TEXT UNIQUE NOT NULL,
                        key_value TEXT NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )

                # System prompts table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS system_prompts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        modality TEXT UNIQUE NOT NULL,
                        content TEXT NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )

                # Unity versions table
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS unity_versions (
                        id TEXT PRIMARY KEY,
                        label TEXT NOT NULL
                    )
                    """
                )

                conn.commit()
                LOGGER.info("Database initialized successfully at %s", db_path)
            finally:
                conn.close()
            return
        except sqlite3.DatabaseError as e:
            err_msg = str(e).lower()
            if "malformed" in err_msg or "corrupt" in err_msg:
                if attempt == 0 and db_path.exists():
                    LOGGER.warning(
                        "Database file corrupt or malformed (%s). Removing and retrying: %s",
                        e,
                        db_path,
                    )
                    try:
                        db_path.unlink()
                    except OSError as unlink_err:
                        LOGGER.error("Failed to remove corrupt DB file: %s", unlink_err)
                        raise
                else:
                    raise
            else:
                raise


def set_pref(key: str, value: str) -> None:
    """
    Set a user preference value.

    Args:
        key: The preference key.
        value: The preference value.

    Raises:
        ValueError: If key or value is empty.
    """
    if not key or not key.strip():
        raise ValueError("key must be a non-empty string")
    if value is None:
        raise ValueError("value cannot be None")

    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_prefs (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, str(value)),
        )
        conn.commit()
    finally:
        conn.close()


def get_pref(key: str) -> str | None:
    """
    Get a user preference value.

    Args:
        key: The preference key.

    Returns:
        The preference value, or None if not found.
    """
    if not key or not key.strip():
        raise ValueError("key must be a non-empty string")

    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM user_prefs WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def get_all_prefs() -> dict[str, str]:
    """
    Get all user preferences.

    Returns:
        Dictionary mapping preference keys to values.
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_prefs")
        return {row[0]: row[1] for row in cursor.fetchall()}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Provider models CRUD
# ---------------------------------------------------------------------------


def get_models(provider: str) -> list[dict[str, str]]:
    """
    Return all models for a given provider.

    Args:
        provider: Canonical lowercase provider name.

    Returns:
        List of dicts with ``value``, ``label``, and ``modality`` keys.

    Example:
        >>> get_models("openai")  # doctest: +SKIP
        [{'value': 'gpt-4o', 'label': 'GPT-4o', 'modality': 'llm'}, ...]
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT model_value, model_label, modality FROM provider_models WHERE provider = ?",
            (provider.lower(),),
        )
        return [{"value": row[0], "label": row[1], "modality": row[2]} for row in cursor.fetchall()]
    finally:
        conn.close()


def get_all_models() -> dict[str, list[dict[str, str]]]:
    """
    Return all models grouped by provider.

    Returns:
        Dictionary mapping provider name to list of model entries.

    Example:
        >>> get_all_models()  # doctest: +SKIP
        {'openai': [{'value': 'gpt-4o', 'label': 'GPT-4o', 'modality': 'llm'}], ...}
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT provider, model_value, model_label, modality FROM provider_models ORDER BY provider"
        )
        result: dict[str, list[dict[str, str]]] = {}
        for provider, value, label, modality in cursor.fetchall():
            result.setdefault(provider, []).append({"value": value, "label": label, "modality": modality})
        return result
    finally:
        conn.close()


def add_model(provider: str, value: str, label: str, modality: str = "llm") -> None:
    """
    Add a model entry for a provider.

    Args:
        provider: Canonical lowercase provider name.
        value: Model identifier (e.g. ``"gpt-4o"``).
        label: Human-readable label (e.g. ``"GPT-4o"``).
        modality: Generation modality (e.g. ``"llm"``, ``"image"``).

    Raises:
        ValueError: If any argument is empty.
        sqlite3.IntegrityError: If the model already exists for the provider.

    Example:
        >>> add_model("openai", "gpt-4o", "GPT-4o", "llm")  # doctest: +SKIP
    """
    if not provider or not value or not label:
        raise ValueError("provider, value, and label must be non-empty strings")
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO provider_models (provider, model_value, model_label, modality)
            VALUES (?, ?, ?, ?)
            """,
            (provider.lower(), value, label, modality.lower()),
        )
        conn.commit()
    finally:
        conn.close()


def remove_model(provider: str, value: str) -> bool:
    """
    Remove a model entry for a provider.

    Args:
        provider: Canonical lowercase provider name.
        value: Model identifier to remove.

    Returns:
        ``True`` if a row was deleted, ``False`` if not found.

    Example:
        >>> remove_model("openai", "gpt-4o")  # doctest: +SKIP
        True
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM provider_models WHERE provider = ? AND model_value = ?",
            (provider.lower(), value),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def seed_default_models(defaults: dict[str, list[dict[str, str]]]) -> None:
    """
    Seed the provider_models table with defaults if it is empty.

    Does nothing if the table already contains data (idempotent).

    Args:
        defaults: Mapping of ``provider -> [{value, label}, ...]``.

    Example:
        >>> seed_default_models({"openai": [{"value": "gpt-4o", "label": "GPT-4o"}]})  # doctest: +SKIP
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM provider_models")
        if cursor.fetchone()[0] > 0:
            return  # Already seeded
        for provider, models in defaults.items():
            for m in models:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO provider_models (provider, model_value, model_label)
                    VALUES (?, ?, ?)
                    """,
                    (provider.lower(), m["value"], m["label"]),
                )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Unity versions (label + id for dropdown)
# ---------------------------------------------------------------------------


def get_unity_versions() -> list[dict[str, str]]:
    """
    Return all Unity versions for dropdown (id = version string, label = display text).

    Returns:
        List of dicts with ``value`` (id) and ``label`` keys.
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, label FROM unity_versions ORDER BY id")
        return [{"value": row[0], "label": row[1]} for row in cursor.fetchall()]
    finally:
        conn.close()


def add_unity_version(version_id: str, label: str) -> None:
    """
    Add a Unity version (id + label). Id is the version string (e.g. 6000.3.2f1).

    Raises:
        ValueError: If version_id or label is empty.
    """
    if not version_id or not version_id.strip():
        raise ValueError("version_id must be non-empty")
    if not label or not label.strip():
        raise ValueError("label must be non-empty")
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO unity_versions (id, label) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET label = excluded.label",
            (version_id.strip(), label.strip()),
        )
        conn.commit()
    finally:
        conn.close()


def seed_unity_versions(defaults: list[dict[str, str]]) -> None:
    """
    Seed unity_versions table if empty. Each item must have ``value`` (id) and ``label``.
    """
    if get_unity_versions():
        return
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        for item in defaults:
            cursor.execute(
                "INSERT INTO unity_versions (id, label) VALUES (?, ?)",
                (item["value"], item["label"]),
            )
        conn.commit()
    finally:
        conn.close()
