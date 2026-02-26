"""Tests for config module."""


import json
from pathlib import Path
from pyfakefs.fake_filesystem_unittest import patchfs
from pyfakefs import fake_filesystem as fs
import pytest

from app.core import config


def test_get_repo_root(fs: fs.FakeFilesystem) -> None:
    """Test that get_repo_root returns a valid path."""
    fs.create_dir('C:/Projects/Unity-Generator')
    root = config.get_repo_root()
    assert isinstance(root, Path)
    assert root.exists()


def test_get_config_dir() -> None:
    """Test that get_config_dir is under repo root."""
    config_dir = config.get_config_dir()
    assert config_dir.name == "config"
    assert config_dir.parent == config.get_repo_root()


def test_get_db_dir() -> None:
    """Test that get_db_dir returns the correct path (repo root or override)."""
    db_dir = config.get_db_dir()
    assert db_dir.name == "db"


def test_get_logs_dir() -> None:
    """Test that get_logs_dir returns the correct path (repo root or override)."""
    logs_dir = config.get_logs_dir()
    assert logs_dir.name == "logs"


def test_get_templates_dir() -> None:
    """Test that get_templates_dir is under repo root."""
    templates_dir = config.get_templates_dir()
    assert templates_dir.name == "unity"
    assert templates_dir == config.get_repo_root() / "backend" / "templates" / "unity"


def test_get_db_dir_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Test get_db_dir environment variable override."""
    monkeypatch.setenv("DATABASE_DIR", str(tmp_path / "custom_db"))
    # Compare string representations for robust comparison
    assert str(config.get_db_dir()) == str(tmp_path / "custom_db")


def test_get_logs_dir_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Test get_logs_dir environment variable override."""
    monkeypatch.setenv("LOGS_DIR", str(tmp_path / "custom_logs"))
    assert str(config.get_logs_dir()) == str(tmp_path / "custom_logs")


def test_get_output_dir_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Test get_output_dir environment variable override."""
    monkeypatch.setenv("OUTPUT_DIR", str(tmp_path / "custom_output"))
    assert str(config.get_output_dir()) == str(tmp_path / "custom_output")
