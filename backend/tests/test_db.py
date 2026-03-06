"""Tests for db module."""


import sqlite3
from pathlib import Path

import pytest

from app.core import db, config


@pytest.fixture
def db_setup(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Mock repo root and ensure db directory exists."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)
    db_dir = tmp_path / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    return tmp_path


def test_init_db_creates_table(db_setup: Path) -> None:
    """Test that init_db creates the user_prefs table."""
    tmp_path = db_setup

    db.init_db()

    db_path = tmp_path / "db" / "user_prefs.db"
    assert db_path.exists()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_prefs'")
    assert cursor.fetchone() is not None
    conn.close()


def test_set_and_get_pref(db_setup: Path) -> None:
    """Test set_pref and get_pref roundtrip."""
    tmp_path = db_setup

    db.init_db()
    db.set_pref("test_key", "test_value")

    value = db.get_pref("test_key")
    assert value == "test_value"


def test_get_pref_returns_none_for_missing_key(db_setup: Path) -> None:
    """Test get_pref returns None when key doesn't exist."""
    tmp_path = db_setup

    db.init_db()

    value = db.get_pref("nonexistent_key")
    assert value is None


def test_set_pref_upsert_behavior(db_setup: Path) -> None:
    """Test that set_pref overwrites existing values."""
    tmp_path = db_setup

    db.init_db()

    db.set_pref("key", "first_value")
    db.set_pref("key", "second_value")

    value = db.get_pref("key")
    assert value == "second_value"


def test_multiple_prefs(db_setup: Path) -> None:
    """Test storing multiple preferences."""
    tmp_path = db_setup

    db.init_db()

    db.set_pref("key1", "value1")
    db.set_pref("key2", "value2")
    db.set_pref("key3", "value3")

    assert db.get_pref("key1") == "value1"
    assert db.get_pref("key2") == "value2"
    assert db.get_pref("key3") == "value3"
