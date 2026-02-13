import base64
import logging
from pathlib import Path

from .schemas import AgentResult

LOGGER = logging.getLogger(__name__)

# Re-use meta generation logic from unity_project.py or move to shared utils
# For now, we'll implement a clean version here for incremental use.

def _write_meta(path: Path, meta_type: str = "default") -> None:
    import uuid
    meta_path = path.with_suffix(path.suffix + ".meta")
    guid = uuid.uuid4().hex

    if meta_type == "script":
        content = f"""fileFormatVersion: 2
guid: {guid}
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
    elif meta_type == "texture":
        content = f"""fileFormatVersion: 2
guid: {guid}
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
    elif meta_type == "audio":
        content = f"""fileFormatVersion: 2
guid: {guid}
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
    else:
        content = f"""fileFormatVersion: 2
guid: {guid}
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""
    meta_path.write_text(content, encoding="utf-8")

def save_asset_to_project(project_path: str, asset_type: str, result: AgentResult) -> str | None:
    """
    Saves a generated asset into the appropriate subfolder of a Unity project.
    Returns the relative path of the saved asset.
    """
    base_path = Path(project_path)
    if not (base_path / "Assets").exists():
        LOGGER.error(f"Invalid project path (missing Assets folder): {project_path}")
        return None

    # Determine subfolder and filename
    import time
    ts = int(time.time())

    rel_path = ""
    content_bytes = b""
    content_text = ""
    meta_type = "default"

    if asset_type == "code":
        target_dir = base_path / "Assets" / "Scripts"
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = result.raw.get("filename") if result.raw else None
        if not filename:
             filename = f"GeneratedScript_{ts}.cs"
        file_path = target_dir / filename
        content_text = result.content or ""
        meta_type = "script"
        rel_path = f"Assets/Scripts/{filename}"

    elif asset_type == "text":
        target_dir = base_path / "Assets" / "Text"
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = result.raw.get("filename") if result.raw else None
        if not filename:
            filename = f"generated_text_{ts}.txt"
        file_path = target_dir / filename
        content_text = result.content or ""
        rel_path = f"Assets/Text/{filename}"

    elif asset_type == "image":
        target_dir = base_path / "Assets" / "Sprites"
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = result.raw.get("filename") if result.raw else None
        if not filename:
            filename = f"image_{ts}.png"
        file_path = target_dir / filename
        meta_type = "texture"
        rel_path = f"Assets/Sprites/{filename}"

        if result.image:
             if result.image.startswith("http"):
                 import requests
                 resp = requests.get(result.image, timeout=30)
                 resp.raise_for_status()
                 content_bytes = resp.content
             else:
                 content_bytes = base64.b64decode(result.image)

    elif asset_type == "audio":
        target_dir = base_path / "Assets" / "Audio"
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = result.raw.get("filename") if result.raw else None
        if not filename:
            filename = f"audio_{ts}.mp3"
        file_path = target_dir / filename
        meta_type = "audio"
        rel_path = f"Assets/Audio/{filename}"

        # Audio bytes might be in raw or result directly depending on provider
        if result.audio:
            content_bytes = base64.b64decode(result.audio)
        elif result.raw and "audio_bytes" in result.raw:
            content_bytes = result.raw["audio_bytes"]

    # Write content
    if content_text:
        file_path.write_text(content_text, encoding="utf-8")
        _write_meta(file_path, meta_type)
    elif content_bytes:
        file_path.write_bytes(content_bytes)
        _write_meta(file_path, meta_type)
    else:
        LOGGER.warning(f"No content found to save for {asset_type} in project.")
        return None

    return rel_path
