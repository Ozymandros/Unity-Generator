from .base import IProviderRepository, IModelRepository, IApiKeyRepository, ISystemPromptRepository
from .sqlite_repository import (
    SqliteProviderRepository,
    SqliteModelRepository,
    SqliteApiKeyRepository,
    SqliteSystemPromptRepository,
)

# Convenience instances or factories could be placed here if needed
# Singleton instances
_PROVIDER_REPO = None
_MODEL_REPO = None
_API_KEY_REPO = None
_SYSTEM_PROMPT_REPO = None

def get_provider_repo() -> IProviderRepository:
    global _PROVIDER_REPO
    if _PROVIDER_REPO is None:
        _PROVIDER_REPO = SqliteProviderRepository()
    return _PROVIDER_REPO

def get_model_repo() -> IModelRepository:
    global _MODEL_REPO
    if _MODEL_REPO is None:
        _MODEL_REPO = SqliteModelRepository()
    return _MODEL_REPO

def get_api_key_repo() -> IApiKeyRepository:
    global _API_KEY_REPO
    if _API_KEY_REPO is None:
        _API_KEY_REPO = SqliteApiKeyRepository()
    return _API_KEY_REPO

def get_system_prompt_repo() -> ISystemPromptRepository:
    global _SYSTEM_PROMPT_REPO
    if _SYSTEM_PROMPT_REPO is None:
        _SYSTEM_PROMPT_REPO = SqliteSystemPromptRepository()
    return _SYSTEM_PROMPT_REPO
