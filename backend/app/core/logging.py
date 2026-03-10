import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "backend.log"
    failed_file = log_dir / "failed_requests.log"

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    file_handler = RotatingFileHandler(log_file, maxBytes=5_000_000, backupCount=3)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    failed_handler = RotatingFileHandler(failed_file, maxBytes=2_000_000, backupCount=2)
    failed_handler.setFormatter(formatter)
    failed_logger = logging.getLogger("failed_requests")
    failed_logger.setLevel(logging.WARNING)
    failed_logger.addHandler(failed_handler)
