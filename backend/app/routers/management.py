import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..repositories import (
    get_provider_repo,
    get_model_repo,
    get_api_key_repo,
    get_system_prompt_repo
)
from ..services.providers.capabilities import ProviderCapabilities, Modality
from ..services.providers.registry import provider_registry

router = APIRouter(prefix="/api/management", tags=["management"])
LOGGER = logging.getLogger(__name__)

# --- Schemas ---

class ProviderUpdate(BaseModel):
    name: str = Field(min_length=1)
    api_key_name: Optional[str] = None
    base_url: Optional[str] = None
    openai_compatible: bool = False
    requires_api_key: bool = True
    supports_vision: bool = False
    supports_streaming: bool = False
    supports_function_calling: bool = False
    supports_tool_use: bool = False
    modalities: List[str]
    default_models: Dict[str, str]
    extra: Dict[str, Any] = {}

class ModelUpdate(BaseModel):
    provider: str = Field(min_length=1)
    value: str = Field(min_length=1)
    label: str = Field(min_length=1)

class ApiKeyUpdate(BaseModel):
    service_name: str = Field(min_length=1)
    key_value: str = Field(min_length=1)

class SystemPromptUpdate(BaseModel):
    modality: str = Field(min_length=1)
    content: str = Field(min_length=1)

# --- Endpoints ---

# Providers
@router.get("/providers", response_model=List[ProviderCapabilities])
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
    # Reload registry to reflect changes immediately
    provider_registry.load_from_db()
    return {"status": "success"}

@router.delete("/providers/{name}")
def delete_provider(name: str):
    success = get_provider_repo().delete(name)
    if not success:
        raise HTTPException(status_code=404, detail="Provider not found")
    provider_registry.load_from_db()
    return {"status": "success"}

# Models
@router.get("/models/{provider}")
def list_models_for_provider(provider: str):
    return get_model_repo().get_by_provider(provider)

@router.post("/models")
def add_model(model: ModelUpdate):
    get_model_repo().add(model.provider, model.value, model.label)
    return {"status": "success"}

@router.delete("/models/{provider}/{value}")
def delete_model(provider: str, value: str):
    success = get_model_repo().remove(provider, value)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"status": "success"}

# API Keys
@router.get("/keys")
def list_keys():
    return get_api_key_repo().get_all()

@router.post("/keys")
def save_key(key: ApiKeyUpdate):
    get_api_key_repo().save(key.service_name, key.key_value)
    return {"status": "success"}

@router.delete("/keys/{service_name}")
def delete_key(service_name: str):
    success = get_api_key_repo().delete(service_name)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"status": "success"}

# System Prompts
@router.get("/prompts")
def list_prompts():
    return get_system_prompt_repo().get_all()

@router.post("/prompts")
def save_prompt(prompt: SystemPromptUpdate):
    get_system_prompt_repo().save(prompt.modality, prompt.content)
    return {"status": "success"}
