from typing import Any, Dict, Optional

from services.image_provider import generate_image


def run(
    prompt: str,
    provider: Optional[str],
    options: Dict[str, Any],
    api_keys: Dict[str, str],
) -> Dict[str, Any]:
    return generate_image(prompt, provider, options, api_keys)
