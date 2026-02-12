"""Tests for unity_project module utilities."""

import base64
from pathlib import Path
from unittest.mock import patch

import pytest
from app import unity_project


def test_safe_name_cleans_special_chars() -> None:
    """Test _safe_name sanitizes special characters."""
    assert unity_project._safe_name("My Project!") == "My_Project"
    assert unity_project._safe_name("test@#$%") == "test"
    assert unity_project._safe_name("   spaces   ") == "spaces"


def test_safe_name_basic() -> None:
    """Test _safe_name returns default for empty string."""
    assert unity_project._safe_name("") == "UnityProject"
    assert unity_project._safe_name("!!!") == "UnityProject"


def test_safe_name_valid_chars() -> None:
    """Test _safe_name keeps valid characters."""
    assert unity_project._safe_name("My_Project-123") == "My_Project-123"


def test_timestamp_format() -> None:
    """Test _timestamp returns correct format."""
    timestamp = unity_project._timestamp()
    # Format: YYYYMMDD_HHMMSS
    assert len(timestamp) == 15
    assert timestamp[8] == "_"


def test_write_text(tmp_path: Path) -> None:
    """Test _write_text writes content correctly."""
    test_file = tmp_path / "test.txt"
    unity_project._write_text(test_file, "test content")
    assert test_file.read_text() == "test content"


def test_write_bytes(tmp_path: Path) -> None:
    """Test _write_bytes writes bytes correctly."""
    test_file = tmp_path / "test.bin"
    unity_project._write_bytes(test_file, b"test bytes")
    assert test_file.read_bytes() == b"test bytes"


def test_ensure_folder_creates_meta(tmp_path: Path) -> None:
    """Test _write_meta creates .meta file."""
    test_file = tmp_path / "test.cs"
    test_file.write_text("// code")

    meta_path = unity_project._write_meta(test_file)

    assert Path(meta_path).exists()
    assert meta_path.endswith(".cs.meta")


def test_write_script_meta(tmp_path: Path) -> None:
    """Test _write_script_meta creates MonoImporter meta."""
    test_file = tmp_path / "script.cs"
    test_file.write_text("// code")

    meta_path = unity_project._write_script_meta(test_file)

    content = Path(meta_path).read_text()
    assert "MonoImporter" in content


def test_write_texture_meta(tmp_path: Path) -> None:
    """Test _write_texture_meta creates TextureImporter meta."""
    test_file = tmp_path / "image.png"
    test_file.write_bytes(b"fake png")

    meta_path = unity_project._write_texture_meta(test_file)

    content = Path(meta_path).read_text()
    assert "TextureImporter" in content


def test_write_audio_meta(tmp_path: Path) -> None:
    """Test _write_audio_meta creates AudioImporter meta."""
    test_file = tmp_path / "audio.mp3"
    test_file.write_bytes(b"fake mp3")

    meta_path = unity_project._write_audio_meta(test_file)

    content = Path(meta_path).read_text()
    assert "AudioImporter" in content


def test_save_image_with_base64(tmp_path: Path) -> None:
    """Test _save_image handles base64 data."""
    test_data = base64.b64encode(b"fake image data").decode()

    files = unity_project._save_image(tmp_path, test_data)

    assert len(files) == 2  # image + meta
    assert any("image_1.png" in f for f in files)


def test_save_image_from_url(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test _save_image handles URL data."""
    with patch.object(unity_project, "_download") as mock_download:
        mock_download.return_value = b"downloaded image"

        files = unity_project._save_image(tmp_path, "https://example.com/image.png")

        assert len(files) == 2
        mock_download.assert_called_once_with("https://example.com/image.png")


def test_save_image_with_list(tmp_path: Path) -> None:
    """Test _save_image handles list data as manifest."""
    files = unity_project._save_image(tmp_path, ["url1", "url2"])

    assert len(files) == 2  # manifest + meta
    assert any("image_manifest.json" in f for f in files)


def test_save_audio_with_bytes(tmp_path: Path) -> None:
    """Test _save_audio handles audio_bytes."""
    data = {"audio_bytes": b"audio data"}

    files = unity_project._save_audio(tmp_path, data)

    assert len(files) == 2
    assert any("audio_1.mp3" in f for f in files)


def test_save_audio_with_url(tmp_path: Path) -> None:
    """Test _save_audio handles audio_url."""
    with patch.object(unity_project, "_download") as mock_download:
        mock_download.return_value = b"downloaded audio"

        data = {"audio_url": "https://example.com/audio.mp3"}
        files = unity_project._save_audio(tmp_path, data)

        assert len(files) == 2
        mock_download.assert_called_once()


def test_get_latest_project_path_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test get_latest_project_path returns None when no projects."""
    monkeypatch.setattr(unity_project, "get_repo_root", lambda: tmp_path)

    result = unity_project.get_latest_project_path()
    assert result is None


def test_get_latest_project_path_returns_latest(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test get_latest_project_path returns most recent project."""
    monkeypatch.setattr(unity_project, "get_repo_root", lambda: tmp_path)

    output_dir = tmp_path / "output"
    output_dir.mkdir()

    import time

    (output_dir / "ProjectA").mkdir()
    time.sleep(0.1)
    (output_dir / "ProjectB").mkdir()

    result = unity_project.get_latest_project_path()
    assert result is not None
    assert "ProjectB" in result


def test_create_unity_project_structure(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Test create_unity_project creates expected folder structure."""
    monkeypatch.setattr(unity_project, "get_repo_root", lambda: tmp_path)

    result = unity_project.create_unity_project(
        "TestProject",
        code="public class Test {}",
        text="Sample text",
        image_data=None,
        audio_data=None,
    )

    assert "project_path" in result
    assert "files" in result

    project_path = Path(result["project_path"])
    assert (project_path / "Assets" / "Scripts" / "GeneratedScript.cs").exists()
    assert (project_path / "Assets" / "Text" / "generated_text.txt").exists()
