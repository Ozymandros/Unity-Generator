"""
Database connection management module.

This module provides database connection pooling and management for the FastAPI backend.
It ensures cross-platform compatibility and graceful shutdown handling.
"""

import logging
import sqlite3
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

from app.core.config import get_db_dir

LOGGER = logging.getLogger(__name__)

# Database connection pool configuration
_POOL_SIZE = 5
_POOL_TIMEOUT = 30.0

# Global connection pool state
_pool: Optional[sqlite3.Connection] = None


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
    """
    db_dir = get_db_dir()
    db_dir.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(get_db_path())
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
        LOGGER.info("Database initialized successfully at %s", get_db_path())
    finally:
        conn.close()


def get_connection() -> sqlite3.Connection:
    """
    Get a database connection from the pool.

    Returns:
        A SQLite connection object.
    """
    global _pool
    if _pool is None:
        _pool = sqlite3.connect(get_db_path(), timeout=_POOL_TIMEOUT)
        _pool.row_factory = sqlite3.Row
        LOGGER.info("Database connection established")
    return _pool


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations with automatic commit/rollback.

    Yields:
        sqlite3.Cursor: A database cursor for executing queries.

    Example:
        >>> with get_db_cursor() as cursor:
        ...     cursor.execute("SELECT * FROM user_prefs")
        ...     rows = cursor.fetchall()
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        LOGGER.error("Database operation failed: %s", str(e))
        raise
    finally:
        cursor.close()


def close_connection() -> None:
    """
    Close the database connection pool gracefully.

    This should be called during application shutdown to ensure
    all database connections are properly closed.
    """
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            LOGGER.info("Database connection closed gracefully")
        except Exception as e:
            LOGGER.error("Error closing database connection: %s", str(e))
        finally:
            _pool = None


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
    
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO user_prefs (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, str(value)),
        )


def get_pref(key: str) -> Optional[str]:
    """
    Get a user preference value.

    Args:
        key: The preference key.

    Returns:
        The preference value, or None if not found.
    """
    if not key or not key.strip():
        raise ValueError("key must be a non-empty string")
    
    with get_db_cursor() as cursor:
        cursor.execute("SELECT value FROM user_prefs WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row["value"] if row else None


def get_all_prefs() -> dict[str, str]:
    """
    Get all user preferences.

    Returns:
        Dictionary mapping preference keys to values.
    """
    with get_db_cursor() as cursor:
        cursor.execute("SELECT key, value FROM user_prefs")
        return {row["key"]: row["value"] for row in cursor.fetchall()}
