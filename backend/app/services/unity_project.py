import base64
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

from ..core.config import get_output_dir


def _safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_\-]", "_", value).strip("_")
    return cleaned or "UnityProject"


def _timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _write_bytes(path: Path, content: bytes) -> None:
    path.write_bytes(content)


def _download(url: str) -> bytes:
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    return response.content


def _write_meta(path: Path, guid: str | None = None, is_folder: bool = False) -> str:
    meta_path = path.with_suffix(path.suffix + ".meta")
    guid_value = guid or uuid.uuid4().hex
    if is_folder:
        content = f"""fileFormatVersion: 2
guid: {guid_value}
folderAsset: yes
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    else:
        content = f"""fileFormatVersion: 2
guid: {guid_value}
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    _write_text(meta_path, content)
    return str(meta_path)


def _write_script_meta(path: Path, guid: str | None = None) -> str:
    meta_path = path.with_suffix(path.suffix + ".meta")
    guid_value = guid or uuid.uuid4().hex
    content = f"""fileFormatVersion: 2
guid: {guid_value}
MonoImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {{instanceID: 0}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    _write_text(meta_path, content)
    return str(meta_path)


def _write_texture_meta(path: Path, guid: str | None = None) -> str:
    meta_path = path.with_suffix(path.suffix + ".meta")
    guid_value = guid or uuid.uuid4().hex
    content = f"""fileFormatVersion: 2
guid: {guid_value}
TextureImporter:
  fileIDToRecycleName: {{}}
  externalObjects: {{}}
  serializedVersion: 12
  mipmaps:
    mipMapMode: 0
    enableMipMap: 1
    sRGBTexture: 1
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  textureFormat: 1
  maxTextureSize: 2048
  textureCompression: 1
  compressionQuality: 50
  spriteMode: 0
  spritePixelsToUnits: 100
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 1
  alphaIsTransparency: 1
  platformSettings: []
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    _write_text(meta_path, content)
    return str(meta_path)


def _write_audio_meta(path: Path, guid: str | None = None) -> str:
    meta_path = path.with_suffix(path.suffix + ".meta")
    guid_value = guid or uuid.uuid4().hex
    content = f"""fileFormatVersion: 2
guid: {guid_value}
AudioImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultSettings:
    loadType: 0
    sampleRateSetting: 0
    sampleRateOverride: 44100
    compressionFormat: 1
    quality: 1
    conversionMode: 0
  platformSettings: []
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    _write_text(meta_path, content)
    return str(meta_path)


def _ensure_folder(path: Path, written_files: list[str]) -> None:
    path.mkdir(parents=True, exist_ok=True)
    written_files.append(str(path))
    written_files.append(_write_meta(path, is_folder=True))


def _save_image(output_dir: Path, data: Any) -> list[str]:
    files: list[str] = []
    if isinstance(data, str):
        if data.startswith("http"):
            content = _download(data)
            file_path = output_dir / "image_1.png"
            _write_bytes(file_path, content)
            files.append(str(file_path))
            files.append(_write_texture_meta(file_path))
        else:
            content = base64.b64decode(data)
            file_path = output_dir / "image_1.png"
            _write_bytes(file_path, content)
            files.append(str(file_path))
            files.append(_write_texture_meta(file_path))
    elif isinstance(data, list):
        manifest_path = output_dir / "image_manifest.json"
        _write_text(manifest_path, json.dumps(data, indent=2))
        files.append(str(manifest_path))
        files.append(_write_meta(manifest_path))
    return files


def _save_audio(output_dir: Path, data: dict[str, Any]) -> list[str]:
    files: list[str] = []
    if "audio_bytes" in data and data["audio_bytes"]:
        file_path = output_dir / "audio_1.mp3"
        _write_bytes(file_path, data["audio_bytes"])
        files.append(str(file_path))
        files.append(_write_audio_meta(file_path))
    if "audio_url" in data and data["audio_url"]:
        content = _download(str(data["audio_url"]))
        file_path = output_dir / "audio_1.mp3"
        _write_bytes(file_path, content)
        files.append(str(file_path))
        files.append(_write_audio_meta(file_path))
    return files


# Minimal package sets per template — enough for inferTemplate() to identify the template.
# Keys match the unity_template values accepted by the API.
_TEMPLATE_PACKAGES: dict[str, dict[str, str]] = {
    "urp": {
        "com.unity.render-pipelines.universal": "17.0.3",
        "com.unity.render-pipelines.core": "17.0.3",
    },
    "hdrp": {
        "com.unity.render-pipelines.high-definition": "17.0.3",
        "com.unity.render-pipelines.core": "17.0.3",
    },
    "vr": {
        "com.unity.xr.management": "4.4.0",
        "com.unity.xr.openxr": "1.10.0",
    },
    "2d": {
        "com.unity.feature.2d": "2.0.0",
    },
    "mobile": {},
    "3d": {},
}


def _write_packages_manifest(
    project_dir: Path,
    written_files: list[str],
    unity_template: str = "",
) -> None:
    """
    Write ``Packages/manifest.json`` with template-appropriate UPM dependencies.

    The manifest is required for ``unityProject:scan`` to read back packages and
    infer the template when the project is re-opened via "Open Folder".

    Args:
        project_dir: Root directory of the Unity project.
        written_files: List to append created file paths to.
        unity_template: Template key (e.g. ``"urp"``, ``"hdrp"``, ``"vr"``, ``"2d"``).
            Falls back to an empty dependencies dict for unknown/blank templates.

    Example:
        >>> _write_packages_manifest(Path("/tmp/MyProject"), [], "urp")
    """
    packages_dir = project_dir / "Packages"
    _ensure_folder(packages_dir, written_files)

    deps = _TEMPLATE_PACKAGES.get(unity_template.strip().lower(), {})
    manifest = {"dependencies": deps}
    manifest_path = packages_dir / "manifest.json"
    _write_text(manifest_path, json.dumps(manifest, indent=2))
    written_files.append(str(manifest_path))


def _write_generator_meta(
    project_dir: Path,
    written_files: list[str],
    unity_template: str = "",
    unity_platform: str = "",
) -> None:
    """
    Write ``ProjectSettings/GeneratorMeta.json`` with template and platform metadata.

    This file is read back by the Electron scan so that "Open Project" / "Open Folder"
    can restore the template and platform fields without inference heuristics.

    Args:
        project_dir: Root directory of the Unity project.
        written_files: List to append created file paths to.
        unity_template: Template key (e.g. ``"urp"``, ``"3d"``).
        unity_platform: Platform key (e.g. ``"windows"``).

    Example:
        >>> _write_generator_meta(Path("/tmp/MyProject"), [], "urp", "windows")
    """
    settings_dir = project_dir / "ProjectSettings"
    settings_dir.mkdir(parents=True, exist_ok=True)
    meta_path = settings_dir / "GeneratorMeta.json"
    _write_text(meta_path, json.dumps({
        "unity_template": unity_template,
        "unity_platform": unity_platform,
    }, indent=2))
    written_files.append(str(meta_path))


def _write_project_settings(
    project_dir: Path,
    written_files: list[str],
    unity_version: str = "",
) -> None:
    """
    Write Unity ProjectSettings directory with a ProjectVersion.txt.

    Args:
        project_dir: Root directory of the Unity project.
        written_files: List to append created file paths to.
        unity_version: Unity version string (e.g. ``"6000.3.2f1"``).
            Falls back to ``"2022.3.0f1"`` when empty.

    Example:
        >>> _write_project_settings(Path("/tmp/MyProject"), [], "6000.3.2f1")
    """
    version = unity_version.strip() if unity_version and unity_version.strip() else "2022.3.0f1"
    settings_dir = project_dir / "ProjectSettings"
    _ensure_folder(settings_dir, written_files)
    version_file = settings_dir / "ProjectVersion.txt"
    _write_text(
        version_file,
        f"m_EditorVersion: {version}\nm_EditorVersionWithRevision: {version} (placeholder)\n",
    )
    written_files.append(str(version_file))
    written_files.append(_write_meta(version_file))


def _write_readme(project_dir: Path, written_files: list[str]) -> None:
    readme = project_dir / "README.txt"
    _write_text(
        readme,
        "Generated by Unity Generator.\nImport this folder as a Unity project.\nScripts are under Assets/Scripts.\n",
    )
    written_files.append(str(readme))
    written_files.append(_write_meta(readme))


def create_unity_project(
    project_name: str,
    code: str | None,
    text: str | None,
    image_data: Any | None,
    audio_data: dict[str, Any] | None,
    unity_version: str = "",
    unity_template: str = "",
    unity_platform: str = "",
) -> dict[str, Any]:
    """
    Scaffold a Unity project directory with optional generated assets.

    Args:
        project_name: Name of the project; used as the folder name (sanitised).
        code: Optional C# script content to write under Assets/Scripts.
        text: Optional text content to write under Assets/Text.
        image_data: Optional image data (URL, base64 string, or list manifest).
        audio_data: Optional audio data dict with ``audio_bytes`` or ``audio_url``.
        unity_version: Unity version string written to ProjectVersion.txt (e.g. ``"6000.3.2f1"``).
        unity_template: Project template hint stored in project metadata (e.g. ``"3d"``, ``"urp"``).
        unity_platform: Target platform hint stored in project metadata (e.g. ``"windows"``).

    Returns:
        Dict with ``project_path`` (absolute path) and ``files`` (list of created paths).

    Example:
        >>> result = create_unity_project("MyGame", None, None, None, None, "6000.3.2f1", "3d", "windows")
        >>> "project_path" in result
        True
    """
    output_root = get_output_dir()
    output_root.mkdir(parents=True, exist_ok=True)

    folder_name = _safe_name(project_name)
    project_dir = output_root / folder_name
    written_files: list[str] = []
    assets_dir = project_dir / "Assets"
    scripts_dir = assets_dir / "Scripts"
    text_dir = assets_dir / "Text"
    image_dir = assets_dir / "Textures"
    audio_dir = assets_dir / "Audio"

    _ensure_folder(project_dir, written_files)
    _ensure_folder(assets_dir, written_files)
    _ensure_folder(scripts_dir, written_files)
    _ensure_folder(text_dir, written_files)
    _ensure_folder(image_dir, written_files)
    _ensure_folder(audio_dir, written_files)
    _write_project_settings(project_dir, written_files, unity_version)
    _write_packages_manifest(project_dir, written_files, unity_template)
    _write_generator_meta(project_dir, written_files, unity_template, unity_platform)
    _write_readme(project_dir, written_files)

    if code:
        script_path = scripts_dir / "GeneratedScript.cs"
        _write_text(script_path, code)
        written_files.append(str(script_path))
        written_files.append(_write_script_meta(script_path))

    if text:
        text_path = text_dir / "generated_text.txt"
        _write_text(text_path, text)
        written_files.append(str(text_path))
        written_files.append(_write_meta(text_path))

    if image_data is not None:
        written_files.extend(_save_image(image_dir, image_data))

    if audio_data is not None:
        written_files.extend(_save_audio(audio_dir, audio_data))

    return {
        "project_path": str(project_dir),
        "files": written_files,
        "unity_version": unity_version or "2022.3.0f1",
        "unity_template": unity_template,
        "unity_platform": unity_platform,
    }


def resolve_project_path(project_name: str) -> str:
    """
    Always: project_path = base_path + project_name (safe folder name).
    Use this everywhere a Unity project path is needed for saving/scenes.
    Returns an absolute path.
    """
    base = get_output_dir()
    return str((base / _safe_name(project_name)).resolve())


def get_latest_project_path() -> str | None:
    output_root = get_output_dir()
    if not output_root.exists():
        return None
    candidates = [p for p in output_root.iterdir() if p.is_dir()]
    if not candidates:
        return None
    latest = max(candidates, key=lambda p: p.stat().st_mtime)
    return str(latest)
