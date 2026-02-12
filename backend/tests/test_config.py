"""Tests for config module."""

import json
from pathlib import Path

import pytest
from app import config


def test_get_repo_root() -> None:
    """Test that get_repo_root returns a valid path."""
    root = config.get_repo_root()
    assert isinstance(root, Path)
    assert root.exists()


def test_get_config_dir() -> None:
    """Test that get_config_dir is under repo root."""
    config_dir = config.get_config_dir()
    assert config_dir.name == "config"
    assert config_dir.parent == config.get_repo_root()


def test_get_db_dir() -> None:
    """Test that get_db_dir is under repo root."""
    db_dir = config.get_db_dir()
    assert db_dir.name == "db"
    assert db_dir.parent == config.get_repo_root()


def test_get_logs_dir() -> None:
    """Test that get_logs_dir is under repo root."""
    logs_dir = config.get_logs_dir()
    assert logs_dir.name == "logs"
    assert logs_dir.parent == config.get_repo_root()


def test_get_templates_dir() -> None:
    """Test that get_templates_dir is under repo root."""
    templates_dir = config.get_templates_dir()
    assert templates_dir.name == "unity"
    assert templates_dir == config.get_repo_root() / "backend" / "templates" / "unity"


def test_load_api_keys_missing_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test load_api_keys returns empty dict when file missing."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    keys = config.load_api_keys()
    assert keys == {}


def test_load_api_keys_valid_json(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test load_api_keys parses valid JSON."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    config_dir = tmp_path / "config"
    config_dir.mkdir()
    keys_file = config_dir / "api_keys.json"
    keys_file.write_text(json.dumps({"openai_api_key": "sk-test"}))

    keys = config.load_api_keys()
    assert keys == {"openai_api_key": "sk-test"}


def test_load_api_keys_invalid_json(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test load_api_keys returns empty dict for invalid JSON."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    config_dir = tmp_path / "config"
    config_dir.mkdir()
    keys_file = config_dir / "api_keys.json"
    keys_file.write_text("not valid json")

    keys = config.load_api_keys()
    assert keys == {}


def test_save_api_keys_creates_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test save_api_keys creates config directory and file."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    config.save_api_keys({"test_key": "test_value"})

    keys_file = tmp_path / "config" / "api_keys.json"
    assert keys_file.exists()

    saved = json.loads(keys_file.read_text())
    assert saved == {"test_key": "test_value"}


def test_resolve_unity_editor_path_not_found(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Test that save and load work together."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    original_keys = {"key1": "value1", "key2": "value2"}
    config.save_api_keys(original_keys)


def test_save_and_load_roundtrip(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test that save and load work together."""
    monkeypatch.setattr(config, "get_repo_root", lambda: tmp_path)

    original_keys = {"key1": "value1", "key2": "value2"}
    config.save_api_keys(original_keys)

    loaded_keys = config.load_api_keys()
    assert loaded_keys == original_keys
