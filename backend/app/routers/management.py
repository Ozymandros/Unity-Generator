import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..core.db import get_all_prefs
from ..core.seeder import DEFAULT_SYSTEM_PROMPTS
from ..repositories import get_api_key_repo, get_model_repo, get_provider_repo, get_system_prompt_repo
from ..schemas import ok_response
from ..services.providers.capabilities import Modality, ProviderCapabilities
from ..services.providers.registry import provider_registry

router = APIRouter(prefix="/api/management", tags=["management"])
LOGGER = logging.getLogger(__name__)


def _do_reset_prompts():
    repo = get_system_prompt_repo()
    for modality, content in DEFAULT_SYSTEM_PROMPTS.items():
        repo.save(modality, content)
    return ok_response(DEFAULT_SYSTEM_PROMPTS)


@router.post("/system-prompts/reset")
def reset_system_prompts():
    """Reset all system prompts to defaults."""
    return _do_reset_prompts()


# --- Discovery ---

@router.get("/all")
def get_all_config():
    """
    Unified discovery endpoint that returns all providers, models, prompts,
    key status, and user preferences in a single request.
    """
    provider_repo = get_provider_repo()
    model_repo = get_model_repo()
    api_key_repo = get_api_key_repo()
    prompt_repo = get_system_prompt_repo()

    # 1. Get all providers
    providers = provider_repo.get_all()

    # 2. Get all models grouped by provider
    all_models = {}
    for p in providers:
        all_models[p.name] = model_repo.get_by_provider(p.name)

    # 3. Get all prompts
    prompts = prompt_repo.get_all()

    # 4. Get API key status (names only)
    keys = list(api_key_repo.get_all().keys())

    # 5. Get all preferences
    preferences = get_all_prefs()

    return {
        "providers": providers,
        "models": all_models,
        "prompts": prompts,
        "keys": keys,
        "preferences": preferences
    }

# --- Schemas ---

class ProviderUpdate(BaseModel):
    name: str = Field(min_length=1)
    api_key_name: str | None = None
    api_key_value: str | None = None
    base_url: str | None = None
    openai_compatible: bool = False
    requires_api_key: bool = True
    supports_vision: bool = False
    supports_streaming: bool = False
    supports_function_calling: bool = False
    supports_tool_use: bool = False
    modalities: list[str]
    default_models: dict[str, str]
    extra: dict[str, Any] = {}

class ModelUpdate(BaseModel):
    provider: str = Field(min_length=1)
    value: str = Field(min_length=1)
    label: str = Field(min_length=1)
    modality: str = Field(default="llm")

class ApiKeyUpdate(BaseModel):
    service_name: str = Field(min_length=1)
    key_value: str = Field(min_length=1)

class SystemPromptUpdate(BaseModel):
    modality: str = Field(min_length=1)
    content: str = Field(min_length=1)

# --- Endpoints ---

# Providers
@router.get("/providers", response_model=list[ProviderCapabilities])
def list_providers():
    return get_provider_repo().get_all()

@router.post("/providers")
def save_provider(provider: ProviderUpdate):
    caps = ProviderCapabilities(
        name=provider.name,
        api_key_name=provider.api_key_name,
        base_url=provider.base_url,
        openai_compatible=provider.openai_compatible,
        requires_api_key=provider.requires_api_key,
        supports_vision=provider.supports_vision,
        supports_streaming=provider.supports_streaming,
        supports_function_calling=provider.supports_function_calling,
        supports_tool_use=provider.supports_tool_use,
        modalities={Modality(m) for m in provider.modalities},
        default_models={Modality(m): model for m, model in provider.default_models.items()},
        extra=provider.extra
    )
    get_provider_repo().save(caps)

    # Unified key saving: If api_key_value is provided, save it under api_key_name (or provider name)
    if provider.api_key_value:
        key_name = provider.api_key_name or provider.name
        get_api_key_repo().save(key_name, provider.api_key_value)
        LOGGER.info(f"Saved API key for {key_name} during provider save.")

    # Reload registry to reflect changes immediately
    provider_registry.load_from_db()
    return ok_response({})

@router.delete("/providers/{name}")
def delete_provider(name: str):
    success = get_provider_repo().delete(name)
    if not success:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider_registry.load_from_db()
    return ok_response({})

# Models
@router.get("/models/{provider}")
def list_models_for_provider(provider: str):
    return get_model_repo().get_by_provider(provider)

@router.post("/models")
def add_model(model: ModelUpdate):
    provider_name = model.provider.strip().lower()
    if get_provider_repo().get_by_name(provider_name) is None:
        raise HTTPException(status_code=400, detail="Provider not found")
    get_model_repo().add(model.provider, model.value, model.label, model.modality)
    return ok_response({})

@router.delete("/models/{provider}/{value}")
def delete_model(provider: str, value: str):
    success = get_model_repo().remove(provider, value)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return ok_response({})

# API Keys
@router.get("/keys")
def list_keys():
    return get_api_key_repo().get_all()

@router.post("/keys")
def save_key(key: ApiKeyUpdate):
    get_api_key_repo().save(key.service_name, key.key_value)
    return ok_response({})

@router.delete("/keys/{service_name}")
def delete_key(service_name: str):
    success = get_api_key_repo().delete(service_name)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found")
    return ok_response({})

# System Prompts
@router.get("/prompts")
def list_prompts():
    return get_system_prompt_repo().get_all()

@router.post("/prompts")
def save_prompt(prompt: SystemPromptUpdate):
    get_system_prompt_repo().save(prompt.modality, prompt.content)
    return ok_response({})
