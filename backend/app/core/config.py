import json
import logging
import os
import platform
from pathlib import Path
from typing import Any, cast

LOGGER = logging.getLogger(__name__)


def get_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


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
    return get_repo_root() / "backend" / "templates" / "unity"


def load_api_keys() -> dict[str, Any]:
    """
    Load API keys from user_prefs database, with lazy migration from legacy JSON.
    """
    from .db import get_all_prefs, set_pref

    all_prefs = get_all_prefs()
    
    # Identify keys that look like API keys (ending in _key)
    api_keys = {k: v for k, v in all_prefs.items() if k.endswith("_api_key")}
    
    # Also check for keys without _api_key suffix if they are known ones
    legacy_keys_map = {
        "google_api_key": "google_api_key",
        "anthropic_api_key": "anthropic_api_key",
        "openai_api_key": "openai_api_key",
        "deepseek_api_key": "deepseek_api_key",
        "openrouter_api_key": "openrouter_api_key",
        "groq_api_key": "groq_api_key",
        "huggingface_api_key": "huggingface_api_key",
        "ollama_api_key": "ollama_api_key",
    }

    # If no keys in DB, check for legacy JSON file and migrate
    if not api_keys or len(api_keys) < 2: # Heuristic: if very few keys, maybe try migration
        config_dir = get_config_dir()
        config_path = config_dir / "api_keys.json"
        if config_path.exists():
            try:
                print(f"[CONFIG] Found legacy api_keys.json at {config_path}. Checking for migration...")
                legacy_data = json.loads(config_path.read_text(encoding="utf-8"))
                migrated_count = 0
                for k, v in legacy_data.items():
                    if v:
                        # Ensure key has _api_key suffix
                        db_key = k if k.endswith("_api_key") else f"{k}_api_key"
                        if db_key not in api_keys:
                            set_pref(db_key, v)
                            api_keys[db_key] = v
                            migrated_count += 1
                
                if migrated_count > 0:
                    print(f"[CONFIG] Migrated {migrated_count} keys to database.")
                    # Keep backup
                    backup_path = config_path.with_suffix(".json.bak")
                    if not backup_path.exists():
                        config_path.rename(backup_path)
                        print(f"[CONFIG] Renamed legacy file to {backup_path}")
            except Exception as e:
                print(f"[CONFIG] Error during migration: {e}")

    return api_keys


def save_api_keys(keys: dict[str, Any]) -> None:
    """
    Save API keys to the user_prefs database.
    """
    from .db import set_pref
    for k, v in keys.items():
        set_pref(k, v)


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
