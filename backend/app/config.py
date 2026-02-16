import json
import logging
import os
import platform
from pathlib import Path
from typing import Any, cast

LOGGER = logging.getLogger(__name__)


def get_repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def get_config_dir() -> Path:
    return get_repo_root() / "config"


def get_db_dir() -> Path:
    return get_repo_root() / "db"


def get_logs_dir() -> Path:
    return get_repo_root() / "logs"


def get_output_dir() -> Path:
    return get_repo_root() / "output"


def get_templates_dir() -> Path:
    """Return the path to the backend C# templates directory."""
    return Path(__file__).resolve().parent.parent / "templates" / "unity"


def load_api_keys() -> dict[str, Any]:
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / "api_keys.json"
    if not config_path.exists():
        LOGGER.warning("API key file not found at %s", config_path)
        return {}
    try:
        return cast(dict[str, Any], json.loads(config_path.read_text(encoding="utf-8")))
    except json.JSONDecodeError:
        LOGGER.exception("API key file is not valid JSON.")
        return {}


def save_api_keys(keys: dict[str, Any]) -> None:
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / "api_keys.json"
    config_path.write_text(json.dumps(keys, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Unity Editor path resolution
# ---------------------------------------------------------------------------

_DEFAULT_UNITY_PATHS: dict[str, list] = {
    "Windows": [
        r"C:\Program Files\Unity\Hub\Editor\*\Editor\Unity.exe",
        r"C:\Program Files\Unity Hub\Editor\*\Editor\Unity.exe",
    ],
    "Darwin": [
        "/Applications/Unity/Hub/Editor/*/Unity.app/Contents/MacOS/Unity",
    ],
    "Linux": [
        "/opt/unity/editor/*/Editor/Unity",
        os.path.expanduser("~/Unity/Hub/Editor/*/Editor/Unity"),
    ],
}


def _find_unity_on_disk() -> Path | None:
    """Attempt to discover a Unity Editor binary from well-known locations."""
    system = platform.system()
    import glob as _glob

    for pattern in _DEFAULT_UNITY_PATHS.get(system, []):
        matches = sorted(_glob.glob(pattern), reverse=True)
        if matches:
            candidate = Path(matches[0])
            if candidate.exists():
                return candidate
    return None


def resolve_unity_editor_path(override: str | None = None) -> Path:
    """
    Resolve the Unity Editor executable path.

    Precedence:
    1. Explicit *override* (from request payload).
    2. ``UNITY_EDITOR_PATH`` environment variable.
    3. User preference stored in SQLite (key ``unity_editor_path``).
    4. Auto-discovery from well-known install locations.

    Args:
        override: Optional explicit path provided by the caller.

    Returns:
        Resolved Path to the Unity Editor executable.

    Raises:
        FileNotFoundError: If no valid Unity Editor path could be resolved.
    """
    # 1. Explicit override
    if override:
        path = Path(override)
        if path.exists():
            return path
        raise FileNotFoundError(f"Unity Editor not found at override path: {override}")

    # 2. Environment variable
    env_path = os.environ.get("UNITY_EDITOR_PATH")
    if env_path:
        path = Path(env_path)
        if path.exists():
            return path
        LOGGER.warning("UNITY_EDITOR_PATH set but not found: %s", env_path)

    # 3. User preference (lazy import to avoid circular dependency)
    try:
        from .db import get_pref

        pref_path = get_pref("unity_editor_path")
        if pref_path:
            path = Path(pref_path)
            if path.exists():
                return path
            LOGGER.warning("Stored unity_editor_path preference not found: %s", pref_path)
    except Exception:
        pass

    # 4. Auto-discovery
    discovered = _find_unity_on_disk()
    if discovered:
        LOGGER.info("Auto-discovered Unity Editor at %s", discovered)
        return discovered

    raise FileNotFoundError("Unity Editor not found. Set UNITY_EDITOR_PATH or configure it in Settings.")
