from fastapi import APIRouter, HTTPException

from ..core.db import get_models, get_pref, set_pref
from ..schemas import (
    GenerationResponse,
    PrefRequest,
    ok_response,
)

# Map preferred_*_model key -> (provider_pref_key, modality)
MODEL_PREF_VALIDATION: dict[str, tuple[str, str]] = {
    "preferred_llm_model": ("preferred_llm_provider", "llm"),
    "preferred_image_model": ("preferred_image_provider", "image"),
    "preferred_audio_model": ("preferred_audio_provider", "audio"),
    "preferred_music_model": ("preferred_music_provider", "music"),
}

# Allowed values for locale preference
ALLOWED_LOCALES: frozenset[str] = frozenset({
    "en", "es", "ca", "eu", "oc", "uk",
    "pt", "gl", "fr", "it", "pl", "zh", "ar", "de",
    "hi", "bn", "ur", "id", "ja", "vi", "ko",
})

router = APIRouter(prefix="/prefs", tags=["preferences"])


@router.get("/{key}", response_model=GenerationResponse)
def get_pref_endpoint(key: str) -> GenerationResponse:
    """
    Get a user preference by key.
    """
    value = get_pref(key)
    return ok_response({"key": key, "value": value})


@router.post("", response_model=GenerationResponse)
def set_pref_endpoint(request: PrefRequest) -> GenerationResponse:
    """
    Set a user preference.

    Validates model preferences against registered provider models, and
    validates preferred_locale against the set of supported locale codes.
    """
    if request.key == "preferred_locale":
        if request.value not in ALLOWED_LOCALES:
            raise HTTPException(
                status_code=400,
                detail=f"Locale '{request.value}' is not supported. Allowed: {sorted(ALLOWED_LOCALES)}",
            )

    if request.key in MODEL_PREF_VALIDATION:
        provider_key, modality = MODEL_PREF_VALIDATION[request.key]
        provider = get_pref(provider_key)
        if provider:
            provider = str(provider).strip().lower()
            models = get_models(provider)
            allowed = [m["value"] for m in models if m.get("modality") == modality]
            if allowed and request.value not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Model '{request.value}' is not registered for provider '{provider}'",
                )
    set_pref(request.key, request.value)
    return ok_response({"key": request.key})

