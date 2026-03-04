import logging
import os
import platform
from pathlib import Path

LOGGER = logging.getLogger(__name__)


def get_repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def get_app_dir() -> Path:
    """Return the path to the app directory (backend/app)."""
    return Path(__file__).resolve().parent.parent


def get_config_dir() -> Path:
    return get_repo_root() / "config"


def get_db_dir() -> Path:
    env_path = os.environ.get("DATABASE_DIR")
    if env_path:
        return Path(env_path)
    return get_repo_root() / "db"


def get_logs_dir() -> Path:
    env_path = os.environ.get("LOGS_DIR")
    if env_path:
        return Path(env_path)
    return get_repo_root() / "logs"


def get_output_dir() -> Path:
    """
    Base path for generated Unity projects (output path from settings DB).
    project_path is always this base_path + project_name; never use project_name alone as a path.
    Precedence: DB preference ``output_base_path`` → env ``OUTPUT_DIR`` → cwd ``output``.
    Relative prefs are resolved against repo root. Default uses cwd so packaged apps don't write into the app dir.
    """
    try:
        from .db import get_pref
        pref = get_pref("output_base_path")
        if pref and pref.strip():
            p = Path(pref.strip())
            if not p.is_absolute():
                p = get_repo_root() / p
            return p.resolve()
    except Exception:
        pass
    env_path = os.environ.get("OUTPUT_DIR")
    if env_path:
        p = Path(env_path)
        if not p.is_absolute():
            p = get_repo_root() / p
        return p.resolve()
    # Default: cwd/output unless that would sit under repo/app, then use user dir
    default_cwd = (Path.cwd() / "output").resolve()
    try:
        repo = get_repo_root().resolve()
        if default_cwd == repo or str(default_cwd).startswith(str(repo) + os.sep):
            user_default = (Path.home() / "UnityGenerator" / "output").resolve()
            LOGGER.info(
                "Output base defaulted to user dir (%s) to avoid writing under app/repo.",
                user_default,
            )
            return user_default
    except Exception:
        pass
    return default_cwd


def get_templates_dir() -> Path:
    """Return the path to the backend C# templates directory."""
    return get_app_dir() / "templates" / "unity"


# ---------------------------------------------------------------------------
# Unity Editor path resolution
# ---------------------------------------------------------------------------

_DEFAULT_UNITY_PATHS: dict[str, list] = {
    "Windows": [
        r"%ProgramFiles%/UnityHub/Editor/*/Editor/Unity.exe",
        r"%ProgramFiles%/Unity Hub/Editor/*/Editor/Unity.exe",
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
