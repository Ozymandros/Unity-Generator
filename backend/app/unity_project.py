import base64
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from .config import get_repo_root


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


def _write_meta(path: Path, guid: Optional[str] = None, is_folder: bool = False) -> str:
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


def _write_script_meta(path: Path, guid: Optional[str] = None) -> str:
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


def _write_texture_meta(path: Path, guid: Optional[str] = None) -> str:
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


def _write_audio_meta(path: Path, guid: Optional[str] = None) -> str:
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


def _ensure_folder(path: Path, written_files: List[str]) -> None:
    path.mkdir(parents=True, exist_ok=True)
    written_files.append(str(path))
    written_files.append(_write_meta(path, is_folder=True))


def _save_image(output_dir: Path, data: Any) -> List[str]:
    files: List[str] = []
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


def _save_audio(output_dir: Path, data: Dict[str, Any]) -> List[str]:
    files: List[str] = []
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


def _write_project_settings(project_dir: Path, written_files: List[str]) -> None:
    settings_dir = project_dir / "ProjectSettings"
    _ensure_folder(settings_dir, written_files)
    version_file = settings_dir / "ProjectVersion.txt"
    _write_text(
        version_file,
        "m_EditorVersion: 2022.3.0f1\nm_EditorVersionWithRevision: 2022.3.0f1 (placeholder)\n",
    )
    written_files.append(str(version_file))
    written_files.append(_write_meta(version_file))


def _write_readme(project_dir: Path, written_files: List[str]) -> None:
    readme = project_dir / "README.txt"
    _write_text(
        readme,
        "Generated by Unity Generator.\n"
        "Import this folder as a Unity project.\n"
        "Scripts are under Assets/Scripts.\n",
    )
    written_files.append(str(readme))
    written_files.append(_write_meta(readme))


def create_unity_project(
    project_name: str,
    code: Optional[str],
    text: Optional[str],
    image_data: Optional[Any],
    audio_data: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    root = get_repo_root()
    output_root = root / "output"
    output_root.mkdir(parents=True, exist_ok=True)

    folder_name = f"{_safe_name(project_name)}_{_timestamp()}"
    project_dir = output_root / folder_name
    written_files: List[str] = []
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
    _write_project_settings(project_dir, written_files)
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
    }


def get_latest_project_path() -> Optional[str]:
    root = get_repo_root()
    output_root = root / "output"
    if not output_root.exists():
        return None
    candidates = [p for p in output_root.iterdir() if p.is_dir()]
    if not candidates:
        return None
    latest = max(candidates, key=lambda p: p.stat().st_mtime)
    return str(latest)
