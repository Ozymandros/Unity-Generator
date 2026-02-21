"""
Main FastAPI application for the Unity Generator backend.

This module defines the API application and includes routers for various features.
"""

import logging
from typing import Any

# Configure logging early
logger = logging.getLogger("unity_generator")
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(name)s: %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import init_db, seed_default_models
from app.routers import config, finalize, generation, models, prefs, projects, scenes

# Import singleton for compatibility if tests rely on app.main.agent_manager

# Initialize database
logger.info("Initializing database...")
init_db()
logger.info("Database initialized.")

# Seed default models for each provider (idempotent — runs only on first launch)
_DEFAULT_MODELS: dict[str, list[dict[str, str]]] = {
    "google": [
        {"value": "gemini-1.5-pro", "label": "Gemini 1.5 Pro"},
        {"value": "gemini-1.5-flash", "label": "Gemini 1.5 Flash"},
    ],
    "openai": [
        {"value": "gpt-4o", "label": "GPT-4o"},
        {"value": "gpt-4o-mini", "label": "GPT-4o Mini"},
        {"value": "o1-preview", "label": "o1 Preview"},
    ],
    "anthropic": [
        {"value": "claude-3-5-sonnet-20240620", "label": "Claude 3.5 Sonnet"},
        {"value": "claude-3-opus-20240229", "label": "Claude 3 Opus"},
    ],
    "deepseek": [
        {"value": "deepseek-chat", "label": "DeepSeek Chat"},
        {"value": "deepseek-coder", "label": "DeepSeek Coder"},
    ],
    "openrouter": [
        {"value": "openrouter/auto", "label": "Auto"},
    ],
    "groq": [
        {"value": "llama-3.1-8b-instant", "label": "Llama 3.1 8B Instant"},
        {"value": "llama3-70b-8192", "label": "Llama 3 70B"},
    ],
    "huggingface": [
        {"value": "google/gemma-2b", "label": "Gemma 2B"},
        {"value": "mistralai/Mistral-7B-Instruct-v0.2", "label": "Mistral 7B Instruct v0.2"},
        {"value": "meta-llama/Meta-Llama-3-8B-Instruct", "label": "Llama 3 8B Instruct"},
        {"value": "HuggingFaceH4/zephyr-7b-beta", "label": "Zephyr 7B Beta"},
        {"value": "tiiuae/falcon-7b-instruct", "label": "Falcon 7B Instruct"},
        {"value": "Qwen/Qwen1.5-7B-Chat", "label": "Qwen 1.5 7B Chat"},
        {"value": "microsoft/Phi-3-mini-4k-instruct", "label": "Phi-3 Mini 4k"},
    ],
    "ollama": [
        {"value": "gemma3:4b", "label": "Gemma 3 4B"},
    ],
    "elevenlabs": [
        {"value": "Rachel", "label": "Rachel"},
        {"value": "Drew", "label": "Drew"},
        {"value": "Clyde", "label": "Clyde"},
        {"value": "Mimi", "label": "Mimi"},
    ],
    "playht": [
        {"value": "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e", "label": "Jennifer"},
        {"value": "s3://voice-cloning-zero-shot/f9ff78ba-d016-47f6-b0ef-dd630f59414e", "label": "William"},
    ],
}
seed_default_models(_DEFAULT_MODELS)
logger.info("Default models seeded.")

# FastAPI app instance
app = FastAPI()
logger.info("FastAPI app instance created.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
        "http://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/debug/sys")
def debug_sys() -> dict[str, Any]:
    logger.info("/debug/sys endpoint called.")
    import sys
    import os
    # Assuming ProviderRegistry needs to be imported for this line to work
    # from app.core.registry import ProviderRegistry # This line would be needed if ProviderRegistry was used
    # reg = ProviderRegistry() # This line is commented out as ProviderRegistry is not imported in the original file
    return {
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "executable": sys.executable,
        "modules_app": [k for k in sys.modules if k.startswith("app")],
        "env": {k: v for k, v in os.environ.items() if "KEY" not in k and "TOKEN" not in k}
    }


@app.get("/health")
def health() -> dict[str, Any]:
    logger.info("/health endpoint called.")
    """
    Health check endpoint for the Unity Generator backend.

    Returns:
        dict[str, Any]: A simple status dictionary indicating the service is running.
    """
    return {"status": "ok"}


# Include routers
logger.info("Including routers...")
app.include_router(generation.router)
app.include_router(config.router)
app.include_router(prefs.router)
app.include_router(projects.router)
app.include_router(scenes.router)
app.include_router(finalize.router)
app.include_router(models.router)
logger.info("Routers included.")

# Uvicorn logging config (optional, for visibility)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)
