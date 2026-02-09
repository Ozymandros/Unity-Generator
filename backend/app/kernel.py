import logging
from typing import Dict, Any

try:
    from semantic_kernel import Kernel
except Exception:  # pragma: no cover - optional dependency at runtime
    Kernel = None


LOGGER = logging.getLogger(__name__)


def create_kernel(settings: Dict[str, Any]) -> "Kernel":
    if Kernel is None:
        raise RuntimeError(
            "semantic-kernel is not installed. Install dependencies before running."
        )
    kernel = Kernel()
    LOGGER.info("Semantic Kernel initialized.")
    return kernel
