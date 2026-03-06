from fastapi import APIRouter

from ..repositories import get_api_key_repo
from ..schemas import (
    ApiKeysRequest,
    GenerationResponse,
    ok_response,
)

router = APIRouter(prefix="/config", tags=["config"])

@router.get("/keys", response_model=GenerationResponse)
def get_keys() -> GenerationResponse:
    keys = get_api_key_repo().get_all()
    return ok_response({"keys": keys})


@router.post("/keys", response_model=GenerationResponse)
def save_keys(request: ApiKeysRequest) -> GenerationResponse:
    repo = get_api_key_repo()
    for service, key in request.keys.items():
        repo.save(service, key)
    return ok_response({"saved": list(request.keys.keys())})

