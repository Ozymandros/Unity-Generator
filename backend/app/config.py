import json
import logging
from pathlib import Path
from typing import Any, Dict


LOGGER = logging.getLogger(__name__)


def get_repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def get_config_dir() -> Path:
    return get_repo_root() / "config"


def get_db_dir() -> Path:
    return get_repo_root() / "db"


def get_logs_dir() -> Path:
    return get_repo_root() / "logs"


def load_api_keys() -> Dict[str, Any]:
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / "api_keys.json"
    if not config_path.exists():
        LOGGER.warning("API key file not found at %s", config_path)
        return {}
    try:
        return json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        LOGGER.exception("API key file is not valid JSON.")
        return {}


def save_api_keys(keys: Dict[str, Any]) -> None:
    config_dir = get_config_dir()
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / "api_keys.json"
    config_path.write_text(json.dumps(keys, indent=2), encoding="utf-8")
