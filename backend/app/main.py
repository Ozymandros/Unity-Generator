import logging
import sys
import os
from typing import Any, Dict

# Add project root to sys.path to allow importing services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .agent_manager import AgentManager
from .config import get_logs_dir, save_api_keys, load_api_keys
from .db import init_db, get_pref, set_pref
from .logging_config import setup_logging
from .schemas import (
    GenerationRequest,
    ApiKeysRequest,
    PrefRequest,
    UnityProjectRequest,
    ok_response,
    error_response,
)
from .unity_project import create_unity_project, get_latest_project_path


setup_logging(get_logs_dir())
LOGGER = logging.getLogger(__name__)

app = FastAPI(title="Unity Generator Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_manager = AgentManager()
init_db()


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.post("/generate/code")
def generate_code(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        data = agent_manager.run_code(
            request.prompt, provider, request.options
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Code generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/text")
def generate_text(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_llm_provider")
        data = agent_manager.run_text(
            request.prompt, provider, request.options
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Text generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/image")
def generate_image(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_image_provider")
        data = agent_manager.run_image(
            request.prompt, provider, request.options
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Image generation failed: %s", exc
        )
        return error_response(str(exc))


@app.post("/generate/audio")
def generate_audio(request: GenerationRequest):
    try:
        provider = request.provider or get_pref("preferred_audio_provider")
        data = agent_manager.run_audio(
            request.prompt, provider, request.options
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Audio generation failed: %s", exc
        )
        return error_response(str(exc))


@app.get("/config/keys")
def get_keys():
    keys = load_api_keys()
    masked = {key: ("***" if value else "") for key, value in keys.items()}
    return ok_response({"keys": masked})


@app.post("/config/keys")
def save_keys(request: ApiKeysRequest):
    save_api_keys(request.keys)
    return ok_response({"saved": list(request.keys.keys())})


@app.get("/prefs/{key}")
def read_pref(key: str):
    value = get_pref(key)
    return ok_response({"key": key, "value": value})


@app.post("/prefs")
def write_pref(request: PrefRequest):
    set_pref(request.key, request.value)
    return ok_response({"key": request.key})


@app.post("/generate/unity-project")
def generate_unity_project(request: UnityProjectRequest):
    try:
        code_provider = request.provider_overrides.get(
            "code", get_pref("preferred_llm_provider")
        )
        text_provider = request.provider_overrides.get(
            "text", get_pref("preferred_llm_provider")
        )
        image_provider = request.provider_overrides.get(
            "image", get_pref("preferred_image_provider")
        )
        audio_provider = request.provider_overrides.get(
            "audio", get_pref("preferred_audio_provider")
        )

        code_output = None
        text_output = None
        image_output = None
        audio_output = None

        if request.code_prompt:
            code_output = agent_manager.run_code(
                request.code_prompt,
                code_provider,
                request.options.get("code", {}),
            ).get("content")

        if request.text_prompt:
            text_output = agent_manager.run_text(
                request.text_prompt,
                text_provider,
                request.options.get("text", {}),
            ).get("content")

        if request.image_prompt:
            image_output = agent_manager.run_image(
                request.image_prompt,
                image_provider,
                request.options.get("image", {}),
            ).get("image")

        if request.audio_prompt:
            audio_output = agent_manager.run_audio(
                request.audio_prompt,
                audio_provider,
                request.options.get("audio", {}),
            )

        data = create_unity_project(
            request.project_name,
            code_output,
            text_output,
            image_output,
            audio_output,
        )
        return ok_response(data)
    except Exception as exc:
        logging.getLogger("failed_requests").warning(
            "Unity project generation failed: %s", exc
        )
        return error_response(str(exc))


@app.get("/output/latest")
def output_latest():
    path = get_latest_project_path()
    if not path:
        return error_response("No output projects found.")
    return ok_response({"path": path})
