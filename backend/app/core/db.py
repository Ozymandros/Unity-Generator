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


def get_all_prefs() -> dict[str, str]:
    conn = sqlite3.connect(get_db_path())
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM user_prefs")
        return {row[0]: row[1] for row in cursor.fetchall()}
    finally:
        conn.close()
