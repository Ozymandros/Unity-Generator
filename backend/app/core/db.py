import sqlite3
from pathlib import Path




def get_db_path() -> Path:
    from .config import get_db_dir
    return get_db_dir() / "user_prefs.db"


def init_db() -> None:
    from .config import get_db_dir
    db_dir = get_db_dir()
    db_dir.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_prefs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL
            )
            """
        )
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
                modalities TEXT NOT NULL, -- JSON array of strings
                default_models TEXT NOT NULL, -- JSON object: modality -> model_id
                extra TEXT -- JSON extra metadata
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS provider_models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL,
                model_value TEXT NOT NULL,
                model_label TEXT NOT NULL,
                UNIQUE(provider, model_value)
            )
            """
        )
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
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS system_prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                modality TEXT UNIQUE NOT NULL, -- code, text, image, audio, music, video, sprite
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def set_pref(key: str, value: str) -> None:
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_prefs (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )
        conn.commit()
    finally:
        conn.close()


def get_pref(key: str) -> str | None:
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM user_prefs WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def get_all_prefs() -> dict[str, str]:
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
        List of dicts with ``value`` and ``label`` keys.

    Example:
        >>> get_models("openai")  # doctest: +SKIP
        [{'value': 'gpt-4o', 'label': 'GPT-4o'}, ...]
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT model_value, model_label FROM provider_models WHERE provider = ?",
            (provider.lower(),),
        )
        return [{"value": row[0], "label": row[1]} for row in cursor.fetchall()]
    finally:
        conn.close()


def get_all_models() -> dict[str, list[dict[str, str]]]:
    """
    Return all models grouped by provider.

    Returns:
        Dictionary mapping provider name to list of model entries.

    Example:
        >>> get_all_models()  # doctest: +SKIP
        {'openai': [{'value': 'gpt-4o', 'label': 'GPT-4o'}], ...}
    """
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT provider, model_value, model_label FROM provider_models ORDER BY provider"
        )
        result: dict[str, list[dict[str, str]]] = {}
        for provider, value, label in cursor.fetchall():
            result.setdefault(provider, []).append({"value": value, "label": label})
        return result
    finally:
        conn.close()


def add_model(provider: str, value: str, label: str) -> None:
    """
    Add a model entry for a provider.

    Args:
        provider: Canonical lowercase provider name.
        value: Model identifier (e.g. ``"gpt-4o"``).
        label: Human-readable label (e.g. ``"GPT-4o"``).

    Raises:
        ValueError: If any argument is empty.
        sqlite3.IntegrityError: If the model already exists for the provider.

    Example:
        >>> add_model("openai", "gpt-4o", "GPT-4o")  # doctest: +SKIP
    """
    if not provider or not value or not label:
        raise ValueError("provider, value, and label must be non-empty strings")
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO provider_models (provider, model_value, model_label)
            VALUES (?, ?, ?)
            """,
            (provider.lower(), value, label),
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
