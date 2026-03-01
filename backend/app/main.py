"""
Main FastAPI application for the Unity Generator backend.

This module defines the API application and includes routers for various features.
"""

import logging
from typing import Any

from app.core.config import get_logs_dir
from app.core.logging import setup_logging

setup_logging(get_logs_dir()) 

# Configure logging early: root logger so all app loggers (e.g. app.agents.unity_agent) emit
_root = logging.getLogger()
_root.setLevel(logging.INFO)
if not _root.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s"))
    _root.addHandler(_handler)

logger = logging.getLogger("unity_generator")
logger.setLevel(logging.INFO)
logger.propagate = True
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import init_db
from app.routers import config, finalize, generation, prefs, projects, scenes

# Import singleton for compatibility if tests rely on app.main.agent_manager

# Initialize database
logger.info("Initializing database...")
init_db()
from app.core.seeder import seed_database
seed_database()
from app.services.providers.registry import provider_registry
provider_registry.load_from_db()
logger.info("Database initialized, seeded, and registry loaded.")

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


from app.routers import config, finalize, generation, prefs, projects, scenes, management

# Include routers
logger.info("Including routers...")
app.include_router(generation.router)
app.include_router(config.router)
app.include_router(prefs.router)
app.include_router(projects.router)
app.include_router(scenes.router)
app.include_router(finalize.router)
app.include_router(management.router)
logger.info("Routers included.")

# Uvicorn logging config (optional, for visibility)
logging.getLogger("uvicorn.error").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)
