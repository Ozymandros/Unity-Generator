from fastapi import APIRouter

from ..core.config import load_api_keys as backend_load_api_keys
from ..core.config import save_api_keys
from ..schemas import (
    ApiKeysRequest,
    GenerationResponse,
    ok_response,
)

router = APIRouter(prefix="/config", tags=["config"])

@router.get("/keys", response_model=GenerationResponse)
def get_keys() -> GenerationResponse:
    keys = backend_load_api_keys()
    return ok_response({"keys": keys})


@router.post("/keys", response_model=GenerationResponse)
def save_keys(request: ApiKeysRequest) -> GenerationResponse:
    save_api_keys(request.keys)
    return ok_response({"saved": list(request.keys.keys())})

